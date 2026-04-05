using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Appointments;
using AGMS.Application.DTOs.Symptoms;

namespace AGMS.Infrastructure.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _repo;
    private readonly ISymptomService _symptomService;

    public AppointmentService(IAppointmentRepository repo, ISymptomService symptomService)
    {
        _repo = repo;
        _symptomService = symptomService;
    }

    public async Task<IEnumerable<AppointmentListItemDto>> GetListAsync(int currentUserId, bool isServiceAdvisor, AppointmentFilterDto filter, CancellationToken ct)
    {
        // Customer: ownerUserId để repo lọc. SA: null để trả tất cả
        int? ownerUserId = isServiceAdvisor ? null : currentUserId;

        // CustomerId filter chỉ SA mới được dùng
        if (!isServiceAdvisor)
            filter.CustomerId = null;

        return await _repo.GetListAsync(ownerUserId, filter, ct);
    }

    public async Task<AppointmentDetailDto?> GetDetailAsync(int appointmentId, int currentUserId, bool isServiceAdvisor, CancellationToken ct)
    {
        int? ownerUserId = isServiceAdvisor ? null : currentUserId;
        var appointment = await _repo.GetByIdAsync(appointmentId, ownerUserId, ct);

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
            RejectionReason = appointment.RejectionReason,
            CreatedBy = appointment.CreatedBy,
            CreatedDate = appointment.CreatedDate,
            ConfirmedBy = appointment.ConfirmedBy,
            ConfirmedDate = appointment.ConfirmedDate,
            ProposedTime = appointment.ProposedTime,
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

        // Chỉ SA mới cần gợi ý triệu chứng + linh kiện, nhưng để đơn giản có thể trả cho cả hai
        // Load triệu chứng gắn với appointment
        if (appointment.AppointmentSymptoms != null && appointment.AppointmentSymptoms.Count > 0)
        {
            detail.Symptoms = appointment.AppointmentSymptoms
                .Select(x => new SymptomDto
                {
                    Id = x.Symptom.SymptomID,
                    Code = x.Symptom.Code,
                    Name = x.Symptom.Name,
                    Description = x.Symptom.Description
                })
                .OrderBy(s => s.Id)
                .ToList();
        }

        // Gợi ý linh kiện dựa trên triệu chứng của appointment
        var suggestedParts = await _symptomService.GetSuggestedPartsForAppointmentAsync(appointment.AppointmentID, ct);
        detail.SuggestedParts = suggestedParts.ToList();

        return detail;
    }

    /// <summary>
    /// Chỉ user có RoleID = 2 (Service Advisor) mới được gọi. Controller đã check, Service check lại để chắc chắn.
    /// </summary>
    public async Task ApproveAsync(int appointmentId, int currentUserId, CancellationToken ct)
    {
        var roleId = await _repo.GetUserRoleIdAsync(currentUserId, ct);
        if (roleId != 2)
            throw new UnauthorizedAccessException("Chỉ Service Advisor (RoleID = 2) mới có thể duyệt lịch hẹn.");

        await _repo.ApproveAsync(appointmentId, currentUserId, ct);
    }

    public async Task RejectAsync(int appointmentId, int currentUserId, string rejectionReason, CancellationToken ct)
    {
        var roleID= await _repo.GetUserRoleIdAsync(currentUserId, ct);
        if(roleID!=2)
            throw new UnauthorizedAccessException("Chỉ Service Advisor (RoleID = 2) mới có thể từ chối lịch hẹn.");

        var reason = rejectionReason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
            throw new InvalidOperationException("Lý do từ chối là bắt buộc.");

        await _repo.RejectAsync(appointmentId, currentUserId, reason, ct);
    }

    public async Task ProposeRescheduleAsync(int appointmentId, int currentUserId, DateTime proposedTime, CancellationToken ct)
    {
        var roleId = await _repo.GetUserRoleIdAsync(currentUserId, ct);
        if (roleId != 2) // Role 2 = ServiceAdvisor
            throw new UnauthorizedAccessException("Chỉ Service Advisor mới có thể đề xuất dời lịch.");

        if (proposedTime <= DateTime.UtcNow)
            throw new InvalidOperationException("Thời gian đề xuất phải lớn hơn thời gian hiện tại.");

        await _repo.ProposeRescheduleAsync(appointmentId, proposedTime, ct);
    }

    public async Task CheckInAsync(int appointmentId, int currentUserId, CancellationToken ct)
    {
        var roleId = await _repo.GetUserRoleIdAsync(currentUserId, ct);
        if (roleId != 2)
            throw new UnauthorizedAccessException("Chỉ Service Advisor (RoleID = 2) mới có thể check-in lịch hẹn.");

        await _repo.CheckInAsync(appointmentId, currentUserId, ct);
    }
}
