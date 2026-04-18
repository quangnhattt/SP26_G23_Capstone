using AGMS.Application.DTOs.Appointments;

namespace AGMS.Application.Contracts;

public interface IAppointmentService
{
    // Lấy danh sách appointments. Customer chỉ thấy của mình, SA thấy tất cả
    Task<AppointmentPagedResultDto<AppointmentListItemDto>> GetListAsync(int currentUserId, bool isServiceAdvisor, AppointmentFilterDto filter, CancellationToken ct);

    // Lấy chi tiết appointment. Customer chỉ xem được của mình, SA xem tất cả
    Task<AppointmentDetailDto?> GetDetailAsync(int appointmentId, int currentUserId, bool isServiceAdvisor, CancellationToken ct);
    Task ApproveAsync(int appointmentId, int currentUserId, CancellationToken ct);
    Task RejectAsync(int appointmentId, int rejectBuildUserId, string rejectionReason, CancellationToken ct);
    Task ProposeRescheduleAsync(int appointmentId, int currentUserId, string reason, CancellationToken ct);
    Task RespondRescheduleAsync(int appointmentId, int currentUserId, RespondRescheduleRequest request, CancellationToken ct);
    Task CheckInAsync(int appointmentId, int currentUserId, CancellationToken ct);
    Task<int?> GetUserRoleIdAsync(int userId, CancellationToken ct);
}
