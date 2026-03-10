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
            .Where(m => m.Status != "WAITING")
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

    public async Task<MaintenancePrintDto?> GetMaintenancePrintAsync(int maintenanceId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car)
            .Include(m => m.MaintenancePackageUsages).ThenInclude(mpu => mpu.Package)
            .ThenInclude(pkg => pkg.MaintenancePackageDetails)
            .ThenInclude(mpd => mpd.Product)
            .Include(m => m.ServiceDetails).ThenInclude(sd => sd.Product)
            .Include(m => m.ServicePartDetails).ThenInclude(spd => spd.Product).FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
        if (maintenance == null)
        {
            return null;
        }
        var packageItems = maintenance.MaintenancePackageUsages.SelectMany(mpu => mpu.Package.MaintenancePackageDetails)
            .Select(mpd => new MaintenanceLineItemDto
            {
                SourceType = "Tu goi he thong",
                ItemCode = mpd.Product.Code,
                ItemName = mpd.Product.Name,
                Quantity = mpd.Quantity,
                UnitPrice = mpd.Product.Price,
                Notes = mpd.Notes,
            });
        var serviceItems = maintenance.ServiceDetails
        .Where(sd => !sd.FromPackage)
        .Select(sd => new MaintenanceLineItemDto
        {
            SourceType = "Dich vu le",
            ItemCode = sd.Product.Code,
            ItemName = sd.Product.Name,
            Quantity = sd.Quantity,
            UnitPrice = sd.Product.Price,
            Notes = sd.Notes,
        });
        var partItems = maintenance.ServicePartDetails
            .Where(spd => !spd.FromPackage)
            .Select(spd => new MaintenanceLineItemDto
            {
                SourceType = "Phu tung le",
                ItemCode = spd.Product.Code,
                ItemName = spd.Product.Name,
                Quantity = spd.Quantity,
                UnitPrice = spd.Product.Price,
                Notes = spd.Notes,
            });
        return new MaintenancePrintDto
        {
            MaintenanceId = maintenance.MaintenanceID,
            Brand = maintenance.Car.Brand,
            Model = maintenance.Car.Model,
            Color = maintenance.Car.Color,
            LicensePlate = maintenance.Car.LicensePlate,
            EngineNumber = maintenance.Car.EngineNumber,
            ChassisNumber = maintenance.Car.ChassisNumber,
            Odometer=maintenance.Car.CurrentOdometer,
            CreatedDate = maintenance.CreatedDate,
            MaintenanceDate = maintenance.MaintenanceDate,
            LineItems = packageItems.Concat(serviceItems).Concat(partItems).ToList()
        };
    }
}
