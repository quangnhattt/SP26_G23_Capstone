using AGMS.Application.Contracts;
using AGMS.Application.DTOs.ServiceOrder;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class CarMaintenanceRepository : ICarMaintenanceRepository
{
    private readonly CarServiceDbContext _db;

    public CarMaintenanceRepository(CarServiceDbContext db)
    {
        _db = db;
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

    public async Task<ServiceOrderIntakeDetailDto?> GetServiceOrderIntakeDetailAsync(int maintenanceId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car).ThenInclude(c => c.Owner)
            .Include(m => m.MaintenancePackageUsages).ThenInclude(u => u.Package)
            .Include(m => m.ServiceDetails).ThenInclude(d => d.Product)
            .Include(m => m.ServicePartDetails).ThenInclude(d => d.Product)
            .Include(m => m.VehicleIntakeConditions)
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);

        if (maintenance == null)
            return null;

        var owner = maintenance.Car.Owner;
        var packageUsage = maintenance.MaintenancePackageUsages
            .OrderByDescending(x => x.UsageID)
            .FirstOrDefault();

        var carDetails = string.Join(" - ", new[]
        {
            maintenance.Car.Brand,
            maintenance.Car.Model,
            maintenance.Car.Color
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
            Package = packageUsage == null
                ? null
                : new IntakePackageDto
                {
                    PackageId = packageUsage.PackageID,
                    PackageCode = packageUsage.Package.PackageCode,
                    PackageName = packageUsage.Package.Name,
                    PackagePrice = packageUsage.AppliedPrice
                },
            ServiceDetails = maintenance.ServiceDetails
                .OrderBy(x => x.ServiceDetailID)
                .Select(x => new IntakeServiceItemDto
                {
                    ServiceProductId = x.ProductID,
                    ServiceProductCode = x.Product.Code,
                    ServiceProductName = x.Product.Name,
                    ServiceQty = x.Quantity,
                    ServicePrice = x.UnitPrice,
                    ServiceStatus = x.ItemStatus,
                    IsServiceAdditional = x.IsAdditional,
                    ServiceNotes = x.Notes
                })
                .ToList(),
            PartDetails = maintenance.ServicePartDetails
                .OrderBy(x => x.ServicePartDetailID)
                .Select(x => new IntakePartItemDto
                {
                    PartProductId = x.ProductID,
                    PartProductCode = x.Product.Code,
                    PartProductName = x.Product.Name,
                    PartQty = x.Quantity,
                    PartPrice = x.UnitPrice,
                    PartStatus = x.ItemStatus,
                    IsPartAdditional = x.IsAdditional,
                    PartNotes = x.Notes
                })
                .ToList(),
            VehicleIntakeConditions = maintenance.VehicleIntakeConditions
                .OrderBy(x => x.Id)
                .Select(x => new IntakeConditionItemDto
                {
                    IntakeConditionId = x.Id,
                    CheckInTime = x.CheckInTime,
                    FrontStatus = x.FrontStatus,
                    RearStatus = x.RearStatus,
                    LeftStatus = x.LeftStatus,
                    RightStatus = x.RightStatus,
                    RoofStatus = x.RoofStatus,
                    IntakeConditionNote = x.ConditionNote
                })
                .ToList()
        };
    }
}
