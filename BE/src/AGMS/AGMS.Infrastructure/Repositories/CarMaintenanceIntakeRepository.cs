using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Intake;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Repositories
{
    public class CarMaintenanceIntakeRepository :ICarMaintenanceIntakeRepository
    {
        private readonly CarServiceDbContext _db;

        public CarMaintenanceIntakeRepository(CarServiceDbContext db)
        {
            _db = db;
        }
        public async Task<IEnumerable<IntakeListItemDto>> GetWaitingIntakesAsync(CancellationToken ct = default)
        {
            return await _db.CarMaintenances.AsNoTracking()
                .Include(m => m.Car).ThenInclude(c => c.Owner)
                .Include(m => m.AssignedTechnician).Where(m => m.Status == "WAITING")
                .OrderByDescending(m => m.MaintenanceID)
                .Select(m=> new IntakeListItemDto
                {
                    MaintenanceId =m.MaintenanceID,
                    CustomerName=m.Car.Owner.FullName,
                    CarInfo=(m.Car.Brand ?? string.Empty) +" - "+ (m.Car.LicensePlate ??string.Empty),
                    MaintenanceDate=m.MaintenanceDate,
                    CompletedDate=m.CompletedDate,
                    MaintenanceType = m.MaintenanceType,
                    Status=m.Status,
                    TechnicianName=m.AssignedTechnician != null ? m.AssignedTechnician.FullName : null
                }).ToListAsync(ct);
        }
        public async Task<bool> IsStaffUserAsync(int userId, CancellationToken ct= default)
        {
            return await _db.Users.AsNoTracking().AnyAsync(u => u.UserID == userId && u.RoleID == 2 && u.IsActive, ct);
        }

    }
}
