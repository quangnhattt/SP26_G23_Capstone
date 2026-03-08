using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Intake;
using AGMS.Application.DTOs.ServiceOrder;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using AGMS.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories
{
    public class CarMaintenanceIntakeRepository : ICarMaintenanceIntakeRepository
    {
        private readonly CarServiceDbContext _db;
        private readonly IPasswordHasher _passwordHasher;

        public CarMaintenanceIntakeRepository(CarServiceDbContext db, IPasswordHasher passwordHasher)
        {
            _db = db;
            _passwordHasher = passwordHasher;
        }

        public async Task<IEnumerable<IntakeListItemDto>> GetWaitingIntakesAsync(CancellationToken ct = default)
        {
            return await _db.CarMaintenances.AsNoTracking()
                .Include(m => m.Car).ThenInclude(c => c.Owner)
                .Include(m => m.AssignedTechnician).Where(m => m.Status == "WAITING")
                .OrderByDescending(m => m.MaintenanceID)
                .Select(m => new IntakeListItemDto
                {
                    MaintenanceId = m.MaintenanceID,
                    CustomerName = m.Car.Owner.FullName,
                    CarInfo = (m.Car.Brand ?? string.Empty) + " - " + (m.Car.LicensePlate ?? string.Empty),
                    MaintenanceDate = m.MaintenanceDate,
                    CompletedDate = m.CompletedDate,
                    MaintenanceType = m.MaintenanceType,
                    Status = m.Status,
                    TechnicianName = m.AssignedTechnician != null ? m.AssignedTechnician.FullName : null
                }).ToListAsync(ct);
        }

        public async Task<IntakeWalkInCreateResponseDto> CreateWalkInIntakeAsync(IntakeWalkInCreateRequest request, int createdByUserId, CancellationToken ct = default)
        {
            if (request.Customer == null) throw new ArgumentException("Customer is required.");
            if (request.Car == null) throw new ArgumentException("Car is required.");
            if (request.Maintenance == null) throw new ArgumentException("Maintenance is required.");

            var maintenanceType = NormalizeMaintenanceType(request.Maintenance.MaintenanceType);

            var serviceDetails = request.ServiceDetails ?? new List<IntakeWalkInServiceDetailItemDto>();
            var partDetails = request.PartDetails ?? new List<IntakeWalkInPartDetailItemDto>();
            var intakeConditions = request.VehicleIntakeConditions ?? new List<IntakeWalkInVehicleIntakeConditionItemDto>();

            if (request.Maintenance.AssignedTechnicianId.HasValue)
            {
                var techExists = await _db.Users.AnyAsync(
                    u => u.UserID == request.Maintenance.AssignedTechnicianId.Value && u.RoleID == 3 && u.IsActive,
                    ct);
                if (!techExists) throw new KeyNotFoundException("Assigned technician not found or inactive.");
            }

            if (request.Maintenance.BayId.HasValue)
            {
                var bayExists = await _db.ServiceBays.AnyAsync(
                    b => b.BayID == request.Maintenance.BayId.Value && b.IsActive,
                    ct);
                if (!bayExists) throw new KeyNotFoundException("Service bay not found or inactive.");
            }

            MaintenancePackage? selectedPackage = null;
            var selectedPackageId = request.PackageSelection?.SelectedPackageId;
            var packageProductIds = new HashSet<int>();

            if (selectedPackageId.HasValue)
            {
                selectedPackage = await _db.MaintenancePackages
                    .FirstOrDefaultAsync(p => p.PackageID == selectedPackageId.Value && p.IsActive, ct);
                if (selectedPackage == null) throw new KeyNotFoundException("Selected maintenance package not found or inactive.");

                var packageProducts = await _db.MaintenancePackageDetails
                    .Where(d => d.PackageID == selectedPackageId.Value)
                    .Select(d => d.ProductID)
                    .ToListAsync(ct);

                packageProductIds = packageProducts.ToHashSet();
            }

            var allProductIds = serviceDetails.Select(x => x.ProductId)
                .Concat(partDetails.Select(x => x.ProductId))
                .Distinct()
                .ToList();

            var productMap = await _db.Products
                .Where(p => allProductIds.Contains(p.ProductID) && p.IsActive)
                .ToDictionaryAsync(p => p.ProductID, ct);

            var missing = allProductIds.Where(id => !productMap.ContainsKey(id)).ToList();
            if (missing.Count > 0) throw new KeyNotFoundException($"Product not found or inactive: {string.Join(",", missing)}");

            foreach (var s in serviceDetails)
            {
                if (!string.Equals(productMap[s.ProductId].Type?.Trim(), "SERVICE", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException($"ProductID {s.ProductId} is not a service type product");
            }

            foreach (var p in partDetails)
            {
                if (!string.Equals(productMap[p.ProductId].Type?.Trim(), "PART", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException($"ProductID {p.ProductId} is not a part");
            }

            var packageAmount = selectedPackage?.FinalPrice ?? selectedPackage?.BasePrice ?? 0m;
            var serviceAmount = serviceDetails.Sum(x => x.Quantity * productMap[x.ProductId].Price);
            var partAmount = partDetails.Sum(x => x.Quantity * productMap[x.ProductId].Price);
            var totalAmount = packageAmount + serviceAmount + partAmount;

            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                var customer = await ResolveCustomerAsync(request.Customer, ct);
                var car = await ResolveCarAsync(request.Car, customer.UserID, ct);
                var createdBy = await ResolveCreatedByUserIdAsync(createdByUserId, ct);

                var maintenance = new CarMaintenance
                {
                    CarID = car.CarID,
                    AppointmentID = null,
                    MaintenanceDate = DateTime.UtcNow,
                    Odometer = car.CurrentOdometer,
                    Status = "WAITING",
                    TotalAmount = totalAmount,
                    DiscountAmount = 0m,
                    MaintenanceType = maintenanceType,
                    MemberDiscountAmount = 0m,
                    MemberDiscountPercent = 0m,
                    RankAtTimeOfService = null,
                    Notes = request.Maintenance.Notes,
                    BayID = request.Maintenance.BayId,
                    CreatedBy = createdBy,
                    AssignedTechnicianID = request.Maintenance.AssignedTechnicianId,
                    TechnicianHistory = null,
                    CreatedDate = DateTime.UtcNow,
                    CompletedDate = null
                };

                _db.CarMaintenances.Add(maintenance);

                if (selectedPackage != null)
                {
                    _db.MaintenancePackageUsages.Add(new MaintenancePackageUsage
                    {
                        Maintenance = maintenance,
                        PackageID = selectedPackage.PackageID,
                        AppliedPrice = packageAmount,
                        DiscountAmount = Math.Max(0m, selectedPackage.BasePrice - packageAmount),
                        AppliedDate = DateTime.UtcNow
                    });
                }

                foreach (var s in serviceDetails)
                {
                    var fromPackage = selectedPackageId.HasValue && packageProductIds.Contains(s.ProductId);

                    _db.ServiceDetails.Add(new ServiceDetail
                    {
                        Maintenance = maintenance,
                        ProductID = s.ProductId,
                        Quantity = s.Quantity,
                        UnitPrice = productMap[s.ProductId].Price,
                        ItemStatus = "APPROVED",
                        IsAdditional = !fromPackage,
                        FromPackage = fromPackage,
                        PackageID = fromPackage ? selectedPackageId : null,
                        Notes = s.Notes
                    });
                }

                foreach (var p in partDetails)
                {
                    var fromPackage = selectedPackageId.HasValue && packageProductIds.Contains(p.ProductId);

                    _db.ServicePartDetails.Add(new ServicePartDetail
                    {
                        Maintenance = maintenance,
                        ProductID = p.ProductId,
                        Quantity = p.Quantity,
                        UnitPrice = productMap[p.ProductId].Price,
                        ItemStatus = "APPROVED",
                        IsAdditional = !fromPackage,
                        InventoryStatus = "PENDING",
                        IssuedQuantity = 0,
                        FromPackage = fromPackage,
                        PackageID = fromPackage ? selectedPackageId : null,
                        Notes = p.Notes
                    });
                }

                foreach (var c in intakeConditions)
                {
                    _db.VehicleIntakeConditions.Add(new VehicleIntakeCondition
                    {
                        CarId = car.CarID,
                        Maintenance = maintenance,
                        CheckInTime = DateTime.UtcNow,
                        FrontStatus = c.FrontStatus,
                        RearStatus = c.RearStatus,
                        LeftStatus = c.LeftStatus,
                        RightStatus = c.RightStatus,
                        RoofStatus = c.RoofStatus,
                        ConditionNote = c.ConditionNote
                    });
                }

                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);

                return new IntakeWalkInCreateResponseDto
                {
                    MaintenanceId = maintenance.MaintenanceID,
                    CustomerId = customer.UserID,
                    CarId = car.CarID,
                    SelectedPackageId = selectedPackageId,
                    TotalAmount = totalAmount,
                    ServiceDetailsCount = serviceDetails.Count,
                    PartDetailsCount = partDetails.Count,
                    VehicleIntakeConditionsCount = intakeConditions.Count,
                    CreatedDateUtc = maintenance.CreatedDate
                };
            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
        }

        public async Task<bool> IsStaffUserAsync(int userId, CancellationToken ct = default)
        {
            return await _db.Users
                .AsNoTracking()
                .AnyAsync(u => u.UserID == userId && u.RoleID == 2 && u.IsActive, ct);
        }

        private static string NormalizeMaintenanceType(string? maintenanceType)
        {
            if (string.IsNullOrWhiteSpace(maintenanceType))
                return "REGULAR";
            var t = maintenanceType.Trim().ToUpperInvariant();
            if (t != "REGULAR" && t != "REPAIR")
                throw new ArgumentException("maintenance.maintenanceType must be either 'REGULAR' or 'REPAIR'");
            return t;
        }

        private async Task<User> ResolveCustomerAsync(IntakeWalkInCustomerInputDto input, CancellationToken ct)
        {
            var mode = NormalizeMode(input.Mode, "customer.mode");
            if (mode == "existing")
            {
                if (!input.CustomerId.HasValue || input.CustomerId <= 0)
                    throw new ArgumentException("customer.customerId is required when mode=existing");
                var existing = await _db.Users.FirstOrDefaultAsync(u => u.UserID == input.CustomerId.Value, ct);
                if (existing == null)
                    throw new KeyNotFoundException("Customer not found.");
                return existing;
            }

            if (string.IsNullOrWhiteSpace(input.FullName))
                throw new ArgumentException("customer.fullName is required when mode=new");
            if (string.IsNullOrWhiteSpace(input.Phone))
                throw new ArgumentException("customer.phone is required when mode=new");

            var phone = input.Phone.Trim();
            if (await _db.Users.AnyAsync(u => u.Phone == phone, ct))
                throw new InvalidOperationException("Phone number already exists.");
            if (await _db.Users.AnyAsync(u => u.Username == phone, ct))
                throw new InvalidOperationException("Username already exists.");

            var email = string.IsNullOrWhiteSpace(input.Email) ? $"walkin.{Guid.NewGuid():N}@local.invalid" : input.Email.Trim();
            if (await _db.Users.AnyAsync(u => u.Email == email, ct))
                throw new InvalidOperationException("Email already exists.");

            var (hash, salt) = _passwordHasher.Hash("123456");
            var roleId = await _db.Roles
                .Where(r => r.RoleName.ToLower() == "customer")
                .Select(r => (int?)r.RoleID)
                .FirstOrDefaultAsync(ct) ?? 4;

            var user = new User
            {
                UserCode = await GenerateUniqueUserCodeAsync(ct),
                FullName = input.FullName.Trim(),
                Username = phone,
                PasswordHash = hash,
                PasswordSalt = salt,
                Email = email,
                Phone = phone,
                RoleID = roleId,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                IsEmailVerified = false
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct);
            return user;
        }

        private async Task<Car> ResolveCarAsync(IntakeWalkInCarInputDto input, int ownerId, CancellationToken ct)
        {
            var mode = NormalizeMode(input.Mode, "car.mode");
            if (mode == "existing")
            {
                if (!input.CarId.HasValue || input.CarId <= 0)
                    throw new ArgumentException("car.carId is required when mode=existing");
                var existing = await _db.Cars.FirstOrDefaultAsync(c => c.CarID == input.CarId.Value && c.OwnerID == ownerId, ct);
                if (existing == null)
                    throw new KeyNotFoundException("Car not found for the customer.");
                if (existing.OwnerID != ownerId)
                    throw new InvalidOperationException("Car does not belong to the customer.");
                return existing;
            }

            if (string.IsNullOrWhiteSpace(input.LicensePlate))
                throw new ArgumentException("car.licensePlate is required when mode=new.");
            if (string.IsNullOrWhiteSpace(input.Brand))
                throw new ArgumentException("car.brand is required when mode=new.");
            if (string.IsNullOrWhiteSpace(input.Model))
                throw new ArgumentException("car.model is required when mode=new.");
            if (!input.Year.HasValue || input.Year.Value < 1900)
                throw new ArgumentException("car.year is invalid.");

            var plate = input.LicensePlate.Trim().ToUpperInvariant();
            if (await _db.Cars.AnyAsync(c => c.LicensePlate == plate, ct))
                throw new InvalidOperationException("License plate already exists.");

            var car = new Car
            {
                LicensePlate = plate,
                Brand = input.Brand.Trim(),
                Model = input.Model.Trim(),
                Year = input.Year.Value,
                Color = input.Color,
                EngineNumber = input.EngineNumber,
                ChassisNumber = input.ChassisNumber,
                OwnerID = ownerId,
                CurrentOdometer = input.CurrentOdometer ?? 0,
                CreatedDate = DateTime.UtcNow
            };

            _db.Cars.Add(car);
            await _db.SaveChangesAsync(ct);
            return car;
        }

        private async Task<int> ResolveCreatedByUserIdAsync(int createdByUserId, CancellationToken ct)
        {
            if (createdByUserId <= 0)
                throw new InvalidOperationException("Bạn cần đăng nhập user roleId = 2 để tạo phiếu walk-in.");

            var isStaffCreator = await _db.Users.AnyAsync(
                u => u.UserID == createdByUserId && u.RoleID == 2 && u.IsActive,
                ct);

            if (!isStaffCreator)
                throw new InvalidOperationException("User hiện tại không hợp lệ để tạo phiếu walk-in (yêu cầu roleId = 2).");

            return createdByUserId;
        }

        private static string NormalizeMode(string? mode, string fieldName)
        {
            if (string.IsNullOrWhiteSpace(mode))
                throw new ArgumentException($"{fieldName} is required and must be 'new' or 'existing'.");
            var m = mode.Trim().ToLowerInvariant();
            if (m != "new" && m != "existing")
                throw new ArgumentException($"{fieldName} must be 'new' or 'existing'.");
            return m;
        }

        private async Task<string> GenerateUniqueUserCodeAsync(CancellationToken ct)
        {
            for (var i = 0; i < 10; i++)
            {
                var code = "USR" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
                if (!await _db.Users.AnyAsync(u => u.UserCode == code, ct))
                    return code;
            }

            return "USR" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        }


        public async Task<ServiceOrderIntakeDetailDto?> GetIntakeDetailAsync(int maintenanceId, CancellationToken ct = default)
        {
            var maintenance = await _db.CarMaintenances.AsNoTracking().
                Include(m => m.Car).ThenInclude(c => c.Owner)
                .Include(m=>m.MaintenancePackageUsages).ThenInclude(u=>u.Package)
                .Include(m => m.ServiceDetails).ThenInclude(d => d.Product)
                .Include(m => m.ServicePartDetails).ThenInclude(d => d.Product)
                .Include(m => m.VehicleIntakeConditions)
                .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
            if (maintenance == null) return null;

            var owner = maintenance.Car.Owner;
            var packageUsage = maintenance.MaintenancePackageUsages
                   .OrderByDescending(x => x.UsageID)
                   .FirstOrDefault();
            var carDetails = string.Join("-", new[]
            {
                maintenance.Car.Brand,
                maintenance.Car.Model,
                maintenance.Car.Color,
            }.Where(x => !string.IsNullOrWhiteSpace(x)));
            return new ServiceOrderIntakeDetailDto
            {
                MaintenanceId = maintenance.MaintenanceID,
                MaintenanceDate = maintenance.MaintenanceDate,
                MaintenanceStatus = maintenance.Status,
                Customer = new IntakeCustomerDto
                {
                    UserCode = owner.UserCode,
                    FullName = owner.FullName,
                    Email = owner.Email,
                    Phone = owner.Phone,
                    Gender = owner.Gender,
                    Dob = owner.DateOfBirth
                },
                Car = new IntakeCarDto
                {
                    LicensePlate = maintenance.Car.LicensePlate,
                    CarDetails = carDetails,
                    EngineNumber = maintenance.Car.EngineNumber,
                    CurrentOdometer = maintenance.Car.CurrentOdometer

                },
                Package = packageUsage == null ? null : new IntakePackageDto
                {
                    PackageId = packageUsage.PackageID,
                    PackageCode = packageUsage.Package.PackageCode,
                    PackageName = packageUsage.Package.Name,
                    PackagePrice = packageUsage.AppliedPrice
                },
                ServiceDetails = maintenance.ServiceDetails.OrderBy(x => x.ServiceDetailID).Select(x => new IntakeServiceItemDto
                {
                    ServiceProductId = x.ProductID,
                    ServiceProductCode = x.Product.Code,
                    ServiceProductName = x.Product.Name,
                    ServiceQty = x.Quantity,
                    ServicePrice = x.UnitPrice,
                    ServiceStatus = x.ItemStatus,
                    IsServiceAdditional = x.IsAdditional,
                    ServiceNotes = x.Notes
                }).ToList(),
                PartDetails = maintenance.ServicePartDetails.OrderBy(x => x.ServicePartDetailID).Select(x => new IntakePartItemDto
                {
                    PartProductId = x.ProductID,
                    PartProductCode = x.Product.Code,
                    PartProductName = x.Product.Name,
                    PartQty = x.Quantity,
                    PartPrice = x.UnitPrice,
                    PartStatus = x.ItemStatus,
                    IsPartAdditional = x.IsAdditional,
                    PartNotes = x.Notes
                }).ToList(),
                VehicleIntakeConditions = maintenance.VehicleIntakeConditions.OrderBy(x => x.Id).Select(x => new IntakeConditionItemDto
                {
                    IntakeConditionId=x.Id,
                    CheckInTime = x.CheckInTime,
                    FrontStatus = x.FrontStatus,
                    RearStatus = x.RearStatus,
                    LeftStatus = x.LeftStatus,
                    RightStatus = x.RightStatus,
                    RoofStatus = x.RoofStatus,
                    IntakeConditionNote = x.ConditionNote
                }).ToList()
            };
        }
    }
}
