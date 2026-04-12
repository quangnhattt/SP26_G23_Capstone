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
                ProposedTime = a.ProposedTime,
                Notes = a.Notes,
                RejectionReason = a.RejectionReason,
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
                Phone = a.CreatedByNavigation.Phone,
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

    public async Task ApproveAsync(int appointmentId, int approvedByUserId, CancellationToken ct)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.AppointmentID == appointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lịch hẹn.");

        if (appointment.Status != "PENDING")
            throw new InvalidOperationException("Chỉ có thể duyệt lịch hẹn đang ở trạng thái PENDING.");

        appointment.Status = "CONFIRMED";
        appointment.ConfirmedBy = approvedByUserId;
        appointment.ConfirmedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
    public async Task RejectAsync(int appointmentId, int rejectedByUserId, string rejectionReason, CancellationToken ct)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.AppointmentID == appointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lịch hẹn.");

        if (appointment.Status != "PENDING")
            throw new InvalidOperationException("Chỉ có thể từ chối lịch hẹn đang ở trạng thái PENDING.");

        appointment.Status = "CANCELLED";
        appointment.RejectionReason = rejectionReason;
        appointment.ConfirmedBy = rejectedByUserId;
        appointment.ConfirmedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }

    public async Task ProposeRescheduleAsync(int appointmentId, string reason, CancellationToken ct)
    {
        var appointment = await _db.Appointments.FirstOrDefaultAsync(a => a.AppointmentID == appointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lịch hẹn.");

        // Chỉ cho phép đề xuất khi đang PENDING hoặc đã RESCHEDULED (đề xuất lại)
        if (appointment.Status != "PENDING" && appointment.Status != "RESCHEDULED")
            throw new InvalidOperationException("Chỉ có thể đề xuất lịch mới cho các lịch hẹn đang chờ duyệt.");

        appointment.Status = "RESCHEDULED";
        appointment.ProposedTime = null;
        appointment.RejectionReason = "SA yêu cầu dời lịch: " + reason;

        await _db.SaveChangesAsync(ct);
    }

    public async Task RespondRescheduleAsync(int appointmentId, bool accept, string? newDate, string? newTime, string? notes, CancellationToken ct)
    {
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.AppointmentID == appointmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lịch hẹn.");

        if (appointment.Status != "RESCHEDULED")
            throw new InvalidOperationException("Lịch hẹn này không ở trạng thái cần phản hồi đề xuất.");

        if (accept)
        {
            if (string.IsNullOrWhiteSpace(newDate) || string.IsNullOrWhiteSpace(newTime))
                throw new InvalidOperationException("Phải cung cấp ngày và giờ mới nếu muốn dời lịch.");

            if (!DateOnly.TryParse(newDate, out var parsedDate) || !TimeOnly.TryParse(newTime, out var parsedTime))
                throw new InvalidOperationException("Định dạng ngày giờ không hợp lệ.");

            appointment.Status = "CONFIRMED";
            appointment.AppointmentDate = parsedDate.ToDateTime(parsedTime);
            appointment.ConfirmedDate = DateTime.UtcNow;
            appointment.ProposedTime = null;
            if (!string.IsNullOrWhiteSpace(notes))
            {
                appointment.Notes = (appointment.Notes ?? "") + "\nKH chọn lịch mới: " + notes;
            }
        }
        else
        {
            appointment.Status = "CANCELLED";
            appointment.RejectionReason = "Khách không đồng ý dời lịch: " + notes;
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task CheckInAsync(int appointmentId, int checkedInByUserId, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var appointment = await _db.Appointments
                .Include(a => a.Car)
                .Include(a => a.RequestedPackage)
                .FirstOrDefaultAsync(a => a.AppointmentID == appointmentId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy lịch hẹn.");

            if (appointment.Status != "CONFIRMED")
                throw new InvalidOperationException("Chỉ có thể check-in lịch hẹn đang ở trạng thái CONFIRMED.");

            // 1. Đổi trạng thái Appointment → CHECKED_IN
            appointment.Status = "CHECKED_IN";

            // 2. Map ServiceType → MaintenanceType
            var maintenanceType = appointment.ServiceType == "MAINTENANCE" ? "MAINTENANCE" : "REPAIR";

            // 3. Tạo bản ghi CarMaintenance mới với status RECEIVED
            var maintenance = new CarMaintenance
            {
                CarID = appointment.CarID,
                AppointmentID = appointment.AppointmentID,
                MaintenanceDate = new DateTime(1900, 1, 1),
                Odometer = appointment.Car.CurrentOdometer,
                Status = "RECEIVED",
                TotalAmount = 0m,
                DiscountAmount = 0m,
                MaintenanceType = maintenanceType,
                MemberDiscountAmount = 0m,
                MemberDiscountPercent = 0m,
                RankAtTimeOfService = null,
                Notes = appointment.Notes,
                BayID = null,
                CreatedBy = checkedInByUserId,
                AssignedTechnicianID = appointment.AssignedTechnicianID,
                TechnicianHistory = null,
                CreatedDate = DateTime.UtcNow,
                CompletedDate = null
            };

            _db.CarMaintenances.Add(maintenance);

            // 4. Nếu Appointment có RequestedPackageID → tạo MaintenancePackageUsage
            if (appointment.RequestedPackageID.HasValue && appointment.RequestedPackage != null)
            {
                var pkg = appointment.RequestedPackage;
                var appliedPrice = pkg.FinalPrice ?? pkg.BasePrice;

                _db.MaintenancePackageUsages.Add(new MaintenancePackageUsage
                {
                    Maintenance = maintenance,
                    PackageID = pkg.PackageID,
                    AppliedPrice = appliedPrice,
                    DiscountAmount = Math.Max(0m, pkg.BasePrice - appliedPrice),
                    AppliedDate = DateTime.UtcNow
                });

                maintenance.TotalAmount = appliedPrice;
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
