using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Product;
using AGMS.Application.DTOs.RepairRequests;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class RepairRequestRepository : IRepairRequestRepository
{
    private readonly CarServiceDbContext _db;

    public RepairRequestRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, CancellationToken ct)
    {
        return await _db.Cars
            .AsNoTracking()
            .Where(c => c.OwnerID == userId)
            .OrderByDescending(c => c.CreatedDate)
            .Select(c => new CustomerCarListItemDto
            {
                CarId = c.CarID,
                LicensePlate = c.LicensePlate,
                Brand = c.Brand,
                Model = c.Model,
                Year = c.Year,
                Color = c.Color,
                CurrentOdometer = c.CurrentOdometer,
                LastMaintenanceDate = c.LastMaintenanceDate,
                NextMaintenanceDate = c.NextMaintenanceDate
            })
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<ServiceProductListItemDto>> GetActiveServiceProductsAsync(CancellationToken ct)
    {
        return await _db.Products
            .AsNoTracking()
            .Where(p => (p.Type == "SERVICE" || p.Type == "Service") && p.IsActive)
            .Select(p => new ServiceProductListItemDto
            {
                Id = p.ProductID,
                Code = p.Code,
                Name = p.Name,
                Price = p.Price,
                Unit = p.Unit != null ? p.Unit.Name : null,
                Category = p.Category != null ? p.Category.Name : null,
                EstimatedDurationHours = p.EstimatedDurationHours,
                Description = p.Description,
                Image = p.Image,
                IsActive = p.IsActive
            })
            .ToListAsync(ct);
    }

    public async Task<Car?> GetCarByIdAsync(int carId, CancellationToken ct)
    {
        return await _db.Cars.AsNoTracking().FirstOrDefaultAsync(c => c.CarID == carId, ct);
    }

    public async Task<Car?> GetCarByIdAndOwnerAsync(int carId, int ownerId, CancellationToken ct)
    {
        return await _db.Cars.FirstOrDefaultAsync(c => c.CarID == carId && c.OwnerID == ownerId, ct);
    }

    public async Task<IEnumerable<MaintenancePackage>> GetActiveMaintenancePackagesAsync(CancellationToken ct)
    {
        return await _db.MaintenancePackages
            .AsNoTracking()
            .Where(p => p.IsActive && p.KilometerMilestone != null)
            .OrderBy(p => p.KilometerMilestone)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<TechnicianListItemDto>> GetActiveTechniciansAsync(CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.RoleID == 3 && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new TechnicianListItemDto
            {
                TechnicianId = u.UserID,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                Skills = u.Skills
            })
            .ToListAsync(ct);
    }

    public async Task<User?> GetActiveTechnicianByIdAsync(int technicianId, CancellationToken ct)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.UserID == technicianId && u.RoleID == 3 && u.IsActive, ct);
    }

    public async Task<string?> GetUserPhoneByIdAsync(int userId, CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.UserID == userId)
            .Select(u => u.Phone)
            .FirstOrDefaultAsync(ct);
    }

    public async Task AddAppointmentAsync(Appointment appointment, CancellationToken ct)
    {
        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddAppointmentSymptomsAsync(int appointmentId, IEnumerable<int> symptomIds, CancellationToken ct)
    {
        var distinctIds = symptomIds.Distinct().ToList();
        if (distinctIds.Count == 0)
        {
            return;
        }

        var rows = distinctIds.Select(id => new AppointmentSymptom
        {
            AppointmentID = appointmentId,
            SymptomID = id
        });

        _db.AppointmentSymptoms.AddRange(rows);
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddCarMaintenanceAsync(CarMaintenance maintenance, CancellationToken ct)
    {
        _db.CarMaintenances.Add(maintenance);
        await _db.SaveChangesAsync(ct);
    }

    // === Scheduling ===

    public async Task<int> CountActiveTechniciansAsync(CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.RoleID == 3 && u.IsActive)
            .CountAsync(ct);
    }

    public async Task<List<int>> GetBookedTechnicianIdsInSlotAsync(DateOnly date, TimeOnly slotStart, CancellationToken ct)
    {
        var slotStartDt = date.ToDateTime(slotStart);
        var slotEndDt = slotStartDt.AddMinutes(Application.Constants.SchedulingConfig.SlotDurationMinutes);

        return await _db.Appointments
            .AsNoTracking()
            .Where(a => a.AppointmentDate >= slotStartDt
                     && a.AppointmentDate < slotEndDt
                     && a.AssignedTechnicianID != null
                     && (a.Status == "PENDING" || a.Status == "CONFIRMED"))
            .Select(a => a.AssignedTechnicianID!.Value)
            .Distinct()
            .ToListAsync(ct);
    }

    public async Task<int> CountAppointmentsInSlotAsync(DateOnly date, TimeOnly slotStart, CancellationToken ct)
    {
        var slotStartDt = date.ToDateTime(slotStart);
        var slotEndDt = slotStartDt.AddMinutes(Application.Constants.SchedulingConfig.SlotDurationMinutes);

        return await _db.Appointments
            .AsNoTracking()
            .Where(a => a.AppointmentDate >= slotStartDt
                     && a.AppointmentDate < slotEndDt
                     && (a.Status == "PENDING" || a.Status == "CONFIRMED"))
            .CountAsync(ct);
    }
}
