using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MaintenanacePackage;
using AGMS.Application.DTOs.ServiceOrder;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using AGMS.Infrastructure.Services;
using Azure.Core;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class CarMaintenanceRepository : ICarMaintenanceRepository
{
    private readonly CarServiceDbContext _db;
    private readonly IPasswordHasher _passwordHasher;


    public CarMaintenanceRepository(CarServiceDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;

    }

    public async Task<IEnumerable<ServiceOrderListItemDto>> GetServiceOrdersForStaffAsync(CancellationToken ct = default)
    {
        return await _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car)
                .ThenInclude(c => c.Owner)
            .Include(m => m.AssignedTechnician)
            .OrderByDescending(m => m.MaintenanceID)
            .Select(m => new ServiceOrderListItemDto
            {
                MaintenanceId = m.MaintenanceID,
                CustomerName = m.Car.Owner.FullName,
                CarInfo = (m.Car.Brand ?? string.Empty) + " - " + (m.Car.LicensePlate ?? string.Empty),
                MaintenanceDate = m.MaintenanceDate,
                CompletedDate = m.CompletedDate,
                MaintenanceType = m.MaintenanceType,
                Status = m.Status,
                TechnicianName = m.AssignedTechnician != null ? m.AssignedTechnician.FullName : null
            })
            .ToListAsync(ct);
    }
    public async Task<WalkInServiceOrderCreateResponseDto> CreateWalkInServiceOrderAsync(WalkInServiceOrderCreateRequest request, int createdByUserId, CancellationToken ct = default)
    {
        if (request.Customer == null) throw new ArgumentException("Customer is required.");
        if (request.Car == null) throw new ArgumentException("Car is required.");
        if (request.Maintenance == null) throw new ArgumentException("Maintenance is required.");

        var maintenanceType = NormalizeMaintenanceType(request.Maintenance.MaintenanceType);

        var serviceDetails = request.ServiceDetails ?? new List<WalkInServiceDetailItemDto>();
        var partDetails = request.PartDetails ?? new List<WalkInPartDetailItemDto>();
        var intakeConditions = request.VehicleIntakeConditions ?? new List<WalkInVehicleIntakeConditionItemDto>();

        if (request.Maintenance.AssignedTechnicianId.HasValue)
        {
            var techExists = await _db.Users.AnyAsync(u => u.UserID == request.Maintenance.AssignedTechnicianId.Value && u.RoleID == 3 && u.IsActive, ct);
            if (!techExists) throw new KeyNotFoundException("Assigned technician not found orr inactive");
        }
        if (request.Maintenance.BayId.HasValue)
        {
            var bayExists = await _db.ServiceBays.AnyAsync(b => b.BayID == request.Maintenance.BayId.Value && b.IsActive, ct);
            if (!bayExists) throw new KeyNotFoundException("Service bay not doung or inactive");
        }
        MaintenancePackage? selectedPackage = null;
        var selectedPackageId = request.PackageSelection?.SelectedPackageId;
        var packageProductIds = new HashSet<int>();
        if (selectedPackageId.HasValue)
        {
            selectedPackage = await _db.MaintenancePackages.FirstOrDefaultAsync(p => p.PackageID == selectedPackageId.Value && p.IsActive, ct);
            if (selectedPackage == null) throw new KeyNotFoundException("Selected maintenanace package not found or inactive");
            var packageProduct = await _db.MaintenancePackageDetails.Where(d => d.PackageID == selectedPackageId.Value).Select(d => d.ProductID).ToListAsync(ct);
            packageProductIds = packageProduct.ToHashSet();
        }
        var allProductIds = serviceDetails.Select(x => x.ProductId)
            .Concat(partDetails.Select(x => x.ProductId)).Distinct().ToList();
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
        var packageAmount = selectedPackage?.FinalPrice ?? selectedPackage?.BasePrice ?? 0;
        var serviceAmoun = serviceDetails.Sum(x => x.Quantity * productMap[x.ProductId].Price);
        var partAmount = partDetails.Sum(x => x.Quantity * productMap[x.ProductId].Price);
        var totalAmount = packageAmount + serviceAmoun + partAmount;
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var customer = await ResolveCustomerAsync(request.Customer, ct);
            var car = await ResolveCarAsync(request.Car, customer.UserID, ct);
            var createdBy = await ResolveCreatedByUserIdAsync(createdByUserId, customer.UserID, ct);
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
            return new WalkInServiceOrderCreateResponseDto
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

    private static string NormalizeMaintenanceType(string? maintenanceType)
    {
        if (string.IsNullOrWhiteSpace(maintenanceType))
            return "REGULAR";
        var t = maintenanceType.Trim().ToUpperInvariant();
        if (t != "REGULAR" && t != "REPAIR")
            throw new ArgumentException("maintenance.maintenanceType must be either 'REGULAR' or 'REPAIR'");
        return t;
    }
    private async Task<User> ResolveCustomerAsync(WalkInCustomerInputDto input, CancellationToken ct)
    {
        var mode = NormalizMode(input.Mode, "customer.mode");
        if (mode == "existing")
        {
            if (!input.CustomerId.HasValue || input.CustomerId <= 0)
                throw new ArgumentException("customer.customerId is required when mode=existing");
            var existing = await _db.Users.FirstOrDefaultAsync(u => u.UserID == input.CustomerId.Value, ct);
            if (existing == null)
                throw new KeyNotFoundException("Customer not found ");
            return existing;
        }
        if (string.IsNullOrWhiteSpace(input.FullName))
            throw new ArgumentException("customer.FullName isrequireed when mode=new");
        if (string.IsNullOrWhiteSpace(input.Phone))
            throw new ArgumentException("customer.phone isrequireed when mode=new");
        var phone = input.Phone.Trim();
        if (await _db.Users.AnyAsync(u => u.Phone == phone, ct))
            throw new InvalidOperationException("Phone number alreadyt exist");
        if (await _db.Users.AnyAsync(u => u.Username == phone, ct))
            throw new InvalidOperationException("Username already exist");
        var email = string.IsNullOrWhiteSpace(input.Email) ? $"walkin.{Guid.NewGuid():N}@local.invalid" : input.Email.Trim();
        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            throw new InvalidOperationException("Email already exist");
        var (hash, salt) = _passwordHasher.Hash("123456");
        var roleId = await _db.Roles.Where(r => r.RoleName.ToLower() == "customer").Select(r => (int?)r.RoleID).FirstOrDefaultAsync(ct) ?? 4;
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
    private async Task<Car> ResolveCarAsync(WalkInCarInputDto input, int ownerId, CancellationToken ct)
    {
        var mode = NormalizMode(input.Mode, "car.mode");
        if (mode == "existing")
        {
            if (!input.CarId.HasValue || input.CarId <= 0)
                throw new ArgumentException("car.carid is required when mode=existing");
            var existing = await _db.Cars.FirstOrDefaultAsync(c => c.CarID == input.CarId.Value && c.OwnerID == ownerId, ct);
            if (existing == null)
                throw new KeyNotFoundException("Car not found for the customer");
            if (existing.OwnerID != ownerId)
                throw new InvalidOperationException("Car does not belong to the customer");
            return existing;
        }
        if (string.IsNullOrWhiteSpace(input.LicensePlate))
            throw new ArgumentException("car.licensePlate is required when mode = new.");
        if (string.IsNullOrWhiteSpace(input.Brand))
            throw new ArgumentException("car.brand is required when mode = new.");
        if (string.IsNullOrWhiteSpace(input.Model))
            throw new ArgumentException("car.model is required when mode = new.");
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
    private async Task<int> ResolveCreatedByUserIdAsync(int createdByUserId, int fallbackCustomerId, CancellationToken ct)
    {
        if (createdByUserId > 0)
        {
            var exists = await _db.Users.AnyAsync(u => u.UserID == createdByUserId, ct);
            if (exists) return createdByUserId;
        }

        return fallbackCustomerId;
    }

    private static string NormalizMode(string? mode, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(mode))
            throw new ArgumentException($"{fieldName} is required and must be 'new' or 'existing'.");
        var m = mode.Trim().ToLowerInvariant();
        if (m != "new" && m != "existing")
            throw new ArgumentException($"{fieldName} is must be 'new' or 'existing'");
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

}

