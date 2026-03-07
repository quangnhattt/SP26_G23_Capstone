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
            .Where(m=>m.Status != "WAITING")
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
}
