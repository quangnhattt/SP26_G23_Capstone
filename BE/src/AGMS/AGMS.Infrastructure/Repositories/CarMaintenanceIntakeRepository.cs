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

        public async Task<PagedResultDto<IntakeListItemDto>> GetIntakesAsync(IntakeListQueryDto query, int currentUserId, int currentRoleId, CancellationToken ct = default)
        {
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 20 : Math.Min(100, query.PageSize);

            // Intake list mặc định = RECEIVED (giống sơ đồ mới).
            var q = _db.CarMaintenances
                .AsNoTracking()
                .Include(m => m.Car).ThenInclude(c => c.Owner)
                .Include(m => m.AssignedTechnician)
                .Where(m => m.Status == "RECEIVED")
                .AsQueryable();

            if (currentRoleId == 3) // Roles.Technician
            {
                q = q.Where(m => m.AssignedTechnicianID == currentUserId);
            }

            if (!string.IsNullOrWhiteSpace(query.MaintenanceType))
            {
                var mt = query.MaintenanceType.Trim().ToUpperInvariant();
                q = q.Where(m => m.MaintenanceType.ToUpper() == mt);
            }

            if (!string.IsNullOrWhiteSpace(query.CustomerName))
            {
                var kw = query.CustomerName.Trim();
                q = q.Where(m => m.Car.Owner.FullName.Contains(kw));
            }

            var total = await q.CountAsync(ct);

            var items = await q
                .OrderByDescending(m => m.MaintenanceID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new IntakeListItemDto
                {
                    MaintenanceId = m.MaintenanceID,
                    CustomerName = m.Car.Owner.FullName,
                    CarInfo = (m.Car.Brand ?? string.Empty) + " - " + (m.Car.LicensePlate ?? string.Empty),
                    MaintenanceDate = m.CreatedDate,
                    CompletedDate = m.CompletedDate,
                    MaintenanceType = m.MaintenanceType,
                    Status = m.Status,
                    TechnicianName = m.AssignedTechnician != null ? m.AssignedTechnician.FullName : null
                })
                .ToListAsync(ct);

            return new PagedResultDto<IntakeListItemDto>
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            };
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
                .Include(p => p.ProductInventory)
                .Include(p => p.Category)
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
            var partAmount = partDetails.Sum(x => x.Quantity * GetPartUnitPrice(productMap[x.ProductId]));
            var totalAmount = packageAmount + serviceAmount + partAmount;

            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                var customer = await ResolveCustomerAsync(request.Customer, ct);
                var car = await ResolveCarAsync(request.Car, customer.UserID, ct);
                var createdBy = await ResolveCreatedByUserIdAsync(createdByUserId, ct);

                var createdUtc = DateTime.UtcNow;
                var maintenance = new CarMaintenance
                {
                    CarID = car.CarID,
                    AppointmentID = null,
                    // MaintenanceDate is finalized when intake is moved to IN_DIAGNOSIS.
                    MaintenanceDate = new DateTime(1900, 1, 1),
                    Odometer = car.CurrentOdometer,
                    Status = "RECEIVED",
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
                    CreatedDate = createdUtc,
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
                    _db.ServiceDetails.Add(new ServiceDetail
                    {
                        Maintenance = maintenance,
                        ProductID = s.ProductId,
                        Quantity = s.Quantity,
                        UnitPrice = productMap[s.ProductId].Price,
                        ItemStatus = "APPROVED",
                        IsAdditional = false,
                        FromPackage = false,
                        PackageID = null,
                        Notes = s.Notes
                    });
                }

                foreach (var p in partDetails)
                {
                    var unitPrice = GetPartUnitPrice(productMap[p.ProductId]);
                    _db.ServicePartDetails.Add(new ServicePartDetail
                    {
                        Maintenance = maintenance,
                        ProductID = p.ProductId,
                        Quantity = p.Quantity,
                        UnitPrice = unitPrice,
                        ItemStatus = "APPROVED",
                        IsAdditional = false,
                        InventoryStatus = "PENDING",
                        IssuedQuantity = 0,
                        FromPackage = false,
                        PackageID = null,
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
                .AnyAsync(u => u.UserID == userId && (u.RoleID == 2 || u.RoleID == 1 || u.RoleID == 3) && u.IsActive, ct);
        }

        private static string NormalizeMaintenanceType(string? maintenanceType)
        {
            if (string.IsNullOrWhiteSpace(maintenanceType))
                return "MAINTENANCE";
            var t = maintenanceType.Trim().ToUpperInvariant();
            if (t != "MAINTENANCE" && t != "REPAIR" && t != "RESCUE")
                throw new ArgumentException("maintenance.maintenanceType must be 'MAINTENANCE', 'REPAIR', or 'RESCUE'");
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
                throw new InvalidOperationException("Bạn cần đăng nhập user roleId = 1 hoặc 2 để tạo phiếu walk-in.");

            var isStaffCreator = await _db.Users.AnyAsync(
                u => u.UserID == createdByUserId && (u.RoleID == 2 || u.RoleID == 1) && u.IsActive,
                ct);

            if (!isStaffCreator)
                throw new InvalidOperationException("User hiện tại không hợp lệ để tạo phiếu walk-in (yêu cầu roleId = 1 hoặc 2).");

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

        private static decimal GetPartUnitPrice(Product product)
        {
            var averageCost = product.ProductInventory?.AverageCost;
            if (!averageCost.HasValue)
            {
                throw new InvalidOperationException(
                    $"ProductID {product.ProductID} has no ProductInventory.AverageCost. Cannot create walk-in with Product.Price fallback.");
            }

            var markupPercent = product.Category?.MarkupPercent ?? 0m;
            return averageCost.Value * (1 + (markupPercent / 100m));
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
                .Include(m=> m.AssignedTechnician)
                .Include(m => m.MaintenancePackageUsages).ThenInclude(u => u.Package)
                .Include(m => m.ServiceDetails).ThenInclude(d => d.Product)
                .Include(m => m.ServicePartDetails).ThenInclude(d => d.Product)
                .Include(m => m.VehicleIntakeConditions)
                .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
            if (maintenance == null) return null;

            var owner = maintenance.Car.Owner;
            var packageUsage = maintenance.MaintenancePackageUsages
                   .OrderByDescending(x => x.UsageID)
                   .FirstOrDefault();
            var tech=maintenance.AssignedTechnician;
            var carDetails = string.Join("-", new[]
            {
                maintenance.Car.Brand,
                maintenance.Car.Model,
                maintenance.Car.Color,
            }.Where(x => !string.IsNullOrWhiteSpace(x)));
            return new ServiceOrderIntakeDetailDto
            {
                MaintenanceId = maintenance.MaintenanceID,
                MaintenanceDate = maintenance.CreatedDate,
                MaintenanceStatus = maintenance.Status,
                MaintenanaceType=maintenance.MaintenanceType,
                BayId= maintenance.BayID,
                Notes= maintenance.Notes,   
                TechnicianId =tech?.UserID,
                TechnicianName=tech?.FullName,
                TechnicianPhone=tech?.Phone,
                TechnicianEmail=tech?.Email,
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
                    Brand = maintenance.Car.Brand,
                    Model= maintenance.Car.Model,
                    Year = maintenance.Car.Year,
                    Color =maintenance.Car.Color,
                    CarDetails = carDetails,
                    EngineNumber = maintenance.Car.EngineNumber,
                    ChassisNumber = maintenance.Car.ChassisNumber,
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
                    IntakeConditionId = x.Id,
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

        public async Task<ServiceOrderIntakeDetailDto?> UpdateIntakeAsync(int maintenanceId, IntakeUpdateRequest request, int UpdateByUserId, CancellationToken ct = default)
        {
            if (request.Maintenance == null) throw new ArgumentException("Maintenance update info is required");

            var maintenanceType = NormalizeMaintenanceType(request.Maintenance.MaintenanceType);
            var serviceDetails = request.ServiceDetails ?? new List<IntakeUpdateServiceDetailItemDto>();
            var partDetails = request.PartDetails ?? new List<IntakeUpdatePartDetailItemDto>();
            var intakeConditions = request.VehicleCondition ?? new List<IntakeUpdateVehicleIntakeConditionItemDto>();
            await ResolveCreatedByUserIdAsync(UpdateByUserId, ct);
            var maintenance = await _db.CarMaintenances
                .Include(m => m.Car).ThenInclude(c => c.Owner)
                .Include(m => m.MaintenancePackageUsages)
                .Include(m => m.ServiceDetails)
                .Include(m => m.ServicePartDetails)
                .Include(m => m.VehicleIntakeConditions)
                .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
            if (maintenance == null)
                return null;
            if (!string.Equals(maintenance.Status, "RECEIVED", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only intakes with status 'RECEIVED' can be updated.");
            if (request.Maintenance.AssignedTechnicianId.HasValue)
            {
                var techExists = await _db.Users.AnyAsync(u => u.UserID == request.Maintenance.AssignedTechnicianId.Value && u.RoleID == 3 && u.IsActive, ct);
                if (!techExists) throw new KeyNotFoundException("Assigned technician not found or inactive");
            }
            if (request.Maintenance.BayId.HasValue)
            {
                var bayExists = await _db.ServiceBays.AnyAsync(b => b.BayID == request.Maintenance.BayId.Value && b.IsActive, ct);
                if (!bayExists) throw new KeyNotFoundException("Service bay not found or inactive");
            }
            MaintenancePackage? selectedPackage = null;
            var selectedPackageId = request.PackageSelection?.SelectedPackageId;
            var packageProductIds = new HashSet<int>();


            if (selectedPackageId.HasValue)
            {
                selectedPackage = await _db.MaintenancePackages.FirstOrDefaultAsync(p => p.PackageID == selectedPackageId.Value && p.IsActive, ct);
                if (selectedPackage == null) throw new KeyNotFoundException("Selected maintenance package not found or inactive");
                var packageProduct = await _db.MaintenancePackageDetails.Where(d => d.PackageID == selectedPackageId.Value).Select(d => d.ProductID).ToListAsync(ct);
                packageProductIds = packageProduct.ToHashSet();
            }
            var allProductIds = serviceDetails.Select(x => x.ProductId).Concat(partDetails.Select(x => x.ProductId)).Distinct().ToList();

            var productMap = await _db.Products.Where(p => allProductIds.Contains(p.ProductID) && p.IsActive).ToDictionaryAsync(p => p.ProductID, ct);
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
                await ApplyCustomerAndCarUpdateAsync(maintenance, request, ct);
                maintenance.MaintenanceType = maintenanceType;
                maintenance.Notes = request.Maintenance.Notes;
                maintenance.AssignedTechnicianID = request.Maintenance.AssignedTechnicianId;
                maintenance.BayID = request.Maintenance.BayId;
                maintenance.TotalAmount = totalAmount;
                if (maintenance.MaintenancePackageUsages.Any())
                    _db.MaintenancePackageUsages.RemoveRange(maintenance.MaintenancePackageUsages);
                if (maintenance.ServiceDetails.Any())
                    _db.ServiceDetails.RemoveRange(maintenance.ServiceDetails);
                if (maintenance.ServicePartDetails.Any())
                    _db.ServicePartDetails.RemoveRange(maintenance.ServicePartDetails);
                if (maintenance.VehicleIntakeConditions.Any())
                    _db.VehicleIntakeConditions.RemoveRange(maintenance.VehicleIntakeConditions);
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
                    _db.ServiceDetails.Add(new ServiceDetail
                    {
                        Maintenance = maintenance,
                        ProductID = s.ProductId,
                        Quantity = s.Quantity,
                        UnitPrice = productMap[s.ProductId].Price,
                        ItemStatus = "APPROVED",
                        IsAdditional = false,
                        FromPackage = false,
                        PackageID = null,
                        Notes = s.Notes
                    });
                }
                foreach (var p in partDetails)
                {
                    _db.ServicePartDetails.Add(new ServicePartDetail
                    {
                        Maintenance = maintenance,
                        ProductID = p.ProductId,
                        Quantity = p.Quantity,
                        UnitPrice = productMap[p.ProductId].Price,
                        ItemStatus = "APPROVED",
                        IsAdditional = false,
                        InventoryStatus = "PENDING",
                        IssuedQuantity = 0,
                        FromPackage = false,
                        PackageID = null,
                        Notes = p.Notes
                    });
                }
                foreach (var c in intakeConditions)
                {
                    _db.VehicleIntakeConditions.Add(new VehicleIntakeCondition
                    {
                        CarId = maintenance.CarID,
                        Maintenance = maintenance,
                        CheckInTime = DateTime.UtcNow,
                        FrontStatus = c.FrontStatus,
                        RearStatus = c.RearStatus,
                        LeftStatus = c.LeftStatus,
                        RightStatus = c.RightStatus,
                        RoofStatus = c.RoofStatus,
                        ConditionNote = c.ConditionNotes
                    });
                }
                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);


            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
            return await GetIntakeDetailAsync(maintenanceId, ct);
        }


        private async Task ApplyCustomerAndCarUpdateAsync(CarMaintenance maintenance, IntakeUpdateRequest request, CancellationToken ct)
        {
            var owner = maintenance.Car.Owner;
            if (request.Customer != null)
            {
                var customer = request.Customer;
                if (customer.FullName != null)
                {
                    if (string.IsNullOrWhiteSpace(customer.FullName))
                        throw new ArgumentException("customer.fullName cannot be empty");
                    owner.FullName = customer.FullName.Trim();
                }
                if (customer.Phone != null)
                {
                    var phone = customer.Phone.Trim();
                    if (string.IsNullOrWhiteSpace(phone))
                        throw new ArgumentException("customer.phone cannot be empty");
                    if (await _db.Users.AnyAsync(u => u.UserID != owner.UserID && u.Phone == phone, ct))
                        throw new InvalidOperationException("Phone number already exists");
                    if (await _db.Users.AnyAsync(u => u.UserID != owner.UserID && u.Username == phone, ct))
                        throw new InvalidOperationException("Username already exists");
                    owner.Phone = phone;
                    owner.Username = phone;
                }
                if (customer.Email != null)
                {
                    var email = customer.Email.Trim();
                    if (string.IsNullOrWhiteSpace(email))
                        throw new ArgumentException("customer.email cannot be empty");
                    if (await _db.Users.AnyAsync(u => u.UserID != owner.UserID && u.Email == email, ct))
                        throw new ArgumentException("Email already exists");
                    owner.Email = email;
                }
                if (customer.Dob.HasValue)
                    owner.DateOfBirth = customer.Dob.Value;
                if (customer.Gender != null)
                    owner.Gender = string.IsNullOrWhiteSpace(customer.Gender) ? null : customer.Gender.Trim();
                if (request.Car != null)
                {
                    var carUpdate = request.Car;
                    var car = maintenance.Car;
                    if (carUpdate.LicensePlate != null)
                    {
                        var plate = carUpdate.LicensePlate.Trim().ToUpperInvariant();
                        if (string.IsNullOrWhiteSpace(plate))
                            throw new ArgumentException("car.licensePlate cannot be empty");
                        if (await _db.Cars.AnyAsync(c => c.CarID != car.CarID && c.LicensePlate == plate, ct))
                            throw new InvalidOperationException("License plate already exists");
                        car.LicensePlate = plate;
                    }
                    if (car.Brand != null)
                    {
                        if (string.IsNullOrWhiteSpace(carUpdate.Brand))
                            throw new ArgumentException("car.brand cannot be empty");
                        car.Brand = carUpdate.Brand.Trim();
                    }
                    if (carUpdate.Model != null)
                    {
                        if (string.IsNullOrWhiteSpace(carUpdate.Model))
                            throw new ArgumentException("car.model cannot be empty");
                        car.Model = carUpdate.Model.Trim();
                    }
                    if (carUpdate.Year.HasValue)
                    {
                        if (carUpdate.Year.Value < 1900)
                            throw new ArgumentException("car.year is invalid");
                        car.Year = carUpdate.Year.Value;
                    }
                    if (carUpdate.Color != null)
                        car.Color = string.IsNullOrWhiteSpace(carUpdate.Color) ? null : carUpdate.Color.Trim();
                    if (carUpdate.EngineNumber != null)
                        car.EngineNumber = string.IsNullOrWhiteSpace(carUpdate.EngineNumber) ? null : carUpdate.EngineNumber.Trim();
                    if (carUpdate.ChassisNumber != null)
                        car.ChassisNumber = string.IsNullOrWhiteSpace(carUpdate.ChassisNumber) ? null : carUpdate.ChassisNumber.Trim();
                    if (carUpdate.CurrentOdometer.HasValue)
                    {
                        if (carUpdate.CurrentOdometer.Value < 0)
                            throw new ArgumentException("car.currentOdometer must be >=0 ");
                        car.CurrentOdometer = carUpdate.CurrentOdometer.Value;
                    }
                }
            }
        }
        public async Task<bool> StartDiagnosisAsync(int maintenanceId, IntakeStartDiagnosisRequest request, int updatedByUserId, CancellationToken ct = default)
        {
            await ResolveCreatedByUserIdAsync(updatedByUserId, ct);
            var maintenance = await _db.CarMaintenances
                .Include(m => m.MaintenancePackageUsages)
                .Include(m => m.ServiceDetails)
                .Include(m => m.ServicePartDetails)
                .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
            if (maintenance == null)
                return false;
            if (!string.Equals(maintenance.Status, "WAITING", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only intake records with status WAITING can be moved to IN_DIAGNOSIS.");

            if (request.PackageId.HasValue)
            {
                var package = await _db.MaintenancePackages
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.PackageID == request.PackageId.Value && p.IsActive, ct);

                if (package == null)
                    throw new KeyNotFoundException("Selected maintenance package not found or inactive.");

                var packageDetails = await _db.MaintenancePackageDetails
                    .AsNoTracking()
                    .Where(d => d.PackageID == request.PackageId.Value)
                    .Select(d => new
                    {
                        d.ProductID,
                        d.Quantity,
                        d.Notes,
                        Product = d.Product
                    })
                    .ToListAsync(ct);

                if (packageDetails.Count == 0)
                    throw new InvalidOperationException("Selected maintenance package has no items.");

                if (!maintenance.MaintenancePackageUsages.Any(x => x.PackageID == request.PackageId.Value))
                {
                    var packageAmount = package.FinalPrice ?? package.BasePrice;
                    _db.MaintenancePackageUsages.Add(new MaintenancePackageUsage
                    {
                        MaintenanceID = maintenanceId,
                        PackageID = package.PackageID,
                        AppliedPrice = packageAmount,
                        DiscountAmount = Math.Max(0m, package.BasePrice - packageAmount),
                        AppliedDate = DateTime.UtcNow
                    });
                }

                foreach (var item in packageDetails)
                {
                    if (item.Product == null || !item.Product.IsActive)
                        continue;

                    if (string.Equals(item.Product.Type?.Trim(), "SERVICE", StringComparison.OrdinalIgnoreCase))
                    {
                        var exists = maintenance.ServiceDetails.Any(sd =>
                            sd.FromPackage &&
                            sd.PackageID == request.PackageId.Value &&
                            sd.ProductID == item.ProductID);
                        if (exists) continue;

                        _db.ServiceDetails.Add(new ServiceDetail
                        {
                            MaintenanceID = maintenanceId,
                            ProductID = item.ProductID,
                            Quantity = item.Quantity,
                            UnitPrice = item.Product.Price,
                            ItemStatus = "APPROVED",
                            IsAdditional = false,
                            FromPackage = true,
                            PackageID = request.PackageId.Value,
                            Notes = item.Notes
                        });
                    }
                    else if (string.Equals(item.Product.Type?.Trim(), "PART", StringComparison.OrdinalIgnoreCase))
                    {
                        var exists = maintenance.ServicePartDetails.Any(spd =>
                            spd.FromPackage &&
                            spd.PackageID == request.PackageId.Value &&
                            spd.ProductID == item.ProductID);
                        if (exists) continue;

                        _db.ServicePartDetails.Add(new ServicePartDetail
                        {
                            MaintenanceID = maintenanceId,
                            ProductID = item.ProductID,
                            Quantity = (int)Math.Ceiling(item.Quantity),
                            UnitPrice = item.Product.Price,
                            ItemStatus = "APPROVED",
                            IsAdditional = false,
                            InventoryStatus = "PENDING",
                            IssuedQuantity = 0,
                            FromPackage = true,
                            PackageID = request.PackageId.Value,
                            Notes = item.Notes
                        });
                    }
                }
            }

            var changedAt = DateTime.UtcNow;
            var oldStatus = maintenance.Status;
            maintenance.Status = "IN_DIAGNOSIS";
            // Actual maintenance handling starts at diagnosis stage.
            maintenance.MaintenanceDate = changedAt;
            _db.MaintenanceStatusLogs.Add(new MaintenanceStatusLog
            {
                MaintenanceID = maintenanceId,
                OldStatus = oldStatus,
                NewStatus = "IN_DIAGNOSIS",
                ChangedBy = updatedByUserId,
                ChangedDate = changedAt,
                Note = string.IsNullOrWhiteSpace(request.Note) ? "Moved to In_DIAGNOSIS from intake." : request.Note.Trim()
            });
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> FinalizeIntakeAsync(int maintenanceId, int updatedByUserId, CancellationToken ct = default)
        {
            await ResolveCreatedByUserIdAsync(updatedByUserId, ct);
            var maintenance = await _db.CarMaintenances
                .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);

            if (maintenance == null)
                return false;

            if (!string.Equals(maintenance.Status, "RECEIVED", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Chỉ có thể chốt lệnh cho phiếu ở trạng thái 'RECEIVED'.");

            maintenance.Status = "WAITING";
            await _db.SaveChangesAsync(ct);
            return true;
        }
    }
}
