using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Appointments;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Services;

public class AppointmentService : IAppointmentService
{
    private readonly CarServiceDbContext _db;

    public AppointmentService(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<AppointmentListItemDto>> GetListAsync(
        int currentUserId,
        bool isServiceAdvisor,
        AppointmentFilterDto filter,
        CancellationToken ct)
    {
        var query = _db.Appointments
            .AsNoTracking()
            .Include(a => a.Car)
            .Include(a => a.CreatedByNavigation)
            .Include(a => a.RequestedPackage)
            .AsQueryable();

        // ── Row-level security ──
        if (!isServiceAdvisor)
        {
            // Customer: only see appointments they created OR whose car they own
            query = query.Where(a =>
                a.CreatedBy == currentUserId || a.Car.OwnerID == currentUserId);
        }

        // ── Optional filters ──
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(a => a.Status == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.ServiceType))
        {
            query = query.Where(a => a.ServiceType == filter.ServiceType);
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(a => a.AppointmentDate >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(a => a.AppointmentDate <= filter.ToDate.Value);
        }

        if (filter.CarId.HasValue)
        {
            query = query.Where(a => a.CarID == filter.CarId.Value);
        }

        // CustomerId filter is SA-only
        if (isServiceAdvisor && filter.CustomerId.HasValue)
        {
            query = query.Where(a => a.CreatedBy == filter.CustomerId.Value);
        }

        var items = await query
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

                // Car
                LicensePlate = a.Car.LicensePlate,
                CarBrand = a.Car.Brand,
                CarModel = a.Car.Model,
                CarYear = a.Car.Year,
                CarColor = a.Car.Color,
                CurrentOdometer = a.Car.CurrentOdometer,

                // Customer
                CustomerFullName = a.CreatedByNavigation.FullName,
                CustomerPhone = a.CreatedByNavigation.Phone,
                CustomerEmail = a.CreatedByNavigation.Email,

                // Package
                PackageName = a.RequestedPackage != null ? a.RequestedPackage.Name : null,
                PackageCode = a.RequestedPackage != null ? a.RequestedPackage.PackageCode : null,
                PackageFinalPrice = a.RequestedPackage != null ? a.RequestedPackage.FinalPrice : null
            })
            .ToListAsync(ct);

        return items;
    }

    public async Task<AppointmentDetailDto?> GetDetailAsync(
        int appointmentId,
        int currentUserId,
        bool isServiceAdvisor,
        CancellationToken ct)
    {
        var query = _db.Appointments
            .AsNoTracking()
            .Include(a => a.Car)
            .Include(a => a.CreatedByNavigation)
            .Include(a => a.RequestedPackage)
            .Include(a => a.CarMaintenances)
            .Where(a => a.AppointmentID == appointmentId);

        // Row-level security for customer
        if (!isServiceAdvisor)
        {
            query = query.Where(a =>
                a.CreatedBy == currentUserId || a.Car.OwnerID == currentUserId);
        }

        var appointment = await query.FirstOrDefaultAsync(ct);

        if (appointment == null)
            return null;

        var detail = new AppointmentDetailDto
        {
            AppointmentId = appointment.AppointmentID,
            CarId = appointment.CarID,
            AppointmentDate = appointment.AppointmentDate,
            ServiceType = appointment.ServiceType,
            RequestedPackageId = appointment.RequestedPackageID,
            Status = appointment.Status,
            Notes = appointment.Notes,
            CreatedBy = appointment.CreatedBy,
            CreatedDate = appointment.CreatedDate,
            ConfirmedBy = appointment.ConfirmedBy,
            ConfirmedDate = appointment.ConfirmedDate,

            Car = new CarInfoDto
            {
                CarId = appointment.Car.CarID,
                LicensePlate = appointment.Car.LicensePlate,
                Brand = appointment.Car.Brand,
                Model = appointment.Car.Model,
                Year = appointment.Car.Year,
                Color = appointment.Car.Color,
                CurrentOdometer = appointment.Car.CurrentOdometer
            },

            Customer = new CustomerInfoDto
            {
                UserId = appointment.CreatedByNavigation.UserID,
                FullName = appointment.CreatedByNavigation.FullName,
                Phone = appointment.CreatedByNavigation.Phone,
                Email = appointment.CreatedByNavigation.Email
            }
        };

        // Package (if any)
        if (appointment.RequestedPackage != null)
        {
            detail.Package = new PackageInfoDto
            {
                PackageId = appointment.RequestedPackage.PackageID,
                PackageName = appointment.RequestedPackage.Name,
                PackageCode = appointment.RequestedPackage.PackageCode,
                FinalPrice = appointment.RequestedPackage.FinalPrice
            };
        }

        // CarMaintenance linked to this appointment (take the first, if any)
        var maintenance = appointment.CarMaintenances.FirstOrDefault();
        if (maintenance != null)
        {
            detail.Maintenance = new CarMaintenanceInfoDto
            {
                MaintenanceId = maintenance.MaintenanceID,
                MaintenanceType = maintenance.MaintenanceType,
                AssignedTechnicianId = maintenance.AssignedTechnicianID,
                TotalAmount = maintenance.TotalAmount,
                FinalAmount = maintenance.FinalAmount,
                Status = maintenance.Status
            };
        }

        return detail;
    }
}
