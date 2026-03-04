using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Appointments;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly CarServiceDbContext _db;

    public AppointmentRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<AppointmentListItemDto>> GetListAsync(int? ownerUserId, AppointmentFilterDto filter, CancellationToken ct)
    {
        var query = _db.Appointments.AsNoTracking().AsQueryable();

        // Row-level security: Customer chỉ thấy appointment của mình
        if (ownerUserId.HasValue)
        {
            var uid = ownerUserId.Value;
            query = query.Where(a => a.CreatedBy == uid || a.Car.OwnerID == uid);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
            query = query.Where(a => a.Status == filter.Status);
        if (!string.IsNullOrWhiteSpace(filter.ServiceType))
            query = query.Where(a => a.ServiceType == filter.ServiceType);
        if (filter.FromDate.HasValue)
            query = query.Where(a => a.AppointmentDate >= filter.FromDate.Value);
        if (filter.ToDate.HasValue)
            query = query.Where(a => a.AppointmentDate <= filter.ToDate.Value);
        if (filter.CarId.HasValue)
            query = query.Where(a => a.CarID == filter.CarId.Value);
        if (filter.CustomerId.HasValue)
            query = query.Where(a => a.CreatedBy == filter.CustomerId.Value);

        return await query
            .OrderByDescending(a => a.AppointmentDate)
            .Select(a => new AppointmentListItemDto
            {
                AppointmentId = a.AppointmentID,
                CarId = a.CarID,
                AppointmentDate = a.AppointmentDate,
                ServiceType = a.ServiceType,
                RequestedPackageId = a.RequestedPackageID,
                Status = a.Status,
                Notes = a.Notes,
                CreatedBy = a.CreatedBy,
                CreatedDate = a.CreatedDate,
                LicensePlate = a.Car.LicensePlate,
                CarBrand = a.Car.Brand,
                CarModel = a.Car.Model,
                CarYear = a.Car.Year,
                CarColor = a.Car.Color,
                CurrentOdometer = a.Car.CurrentOdometer,
                CustomerFullName = a.CreatedByNavigation.FullName,
                CustomerPhone = a.CreatedByNavigation.Phone,
                CustomerEmail = a.CreatedByNavigation.Email,
                PackageName = a.RequestedPackage != null ? a.RequestedPackage.Name : null,
                PackageCode = a.RequestedPackage != null ? a.RequestedPackage.PackageCode : null,
                PackageFinalPrice = a.RequestedPackage != null ? a.RequestedPackage.FinalPrice : null
            })
            .ToListAsync(ct);
    }

    public async Task<Appointment?> GetByIdAsync(int appointmentId, int? ownerUserId, CancellationToken ct)
    {
        var query = _db.Appointments
            .AsNoTracking()
            .Include(a => a.Car)
            .Include(a => a.CreatedByNavigation)
            .Include(a => a.RequestedPackage)
            .Include(a => a.CarMaintenances)
            .Where(a => a.AppointmentID == appointmentId);

        if (ownerUserId.HasValue)
        {
            var uid = ownerUserId.Value;
            query = query.Where(a => a.CreatedBy == uid || a.Car.OwnerID == uid);
        }

        return await query.FirstOrDefaultAsync(ct);
    }

    public async Task<int?> GetUserRoleIdAsync(int userId, CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.UserID == userId)
            .Select(u => new { u.RoleID })
            .FirstOrDefaultAsync(ct);
        return user?.RoleID;
    }
}
