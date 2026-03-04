using AGMS.Application.DTOs.Appointments;

namespace AGMS.Application.Contracts;

public interface IAppointmentService
{
    // Lấy danh sách appointments. Customer chỉ thấy của mình, SA thấy tất cả
    Task<IEnumerable<AppointmentListItemDto>> GetListAsync(int currentUserId, bool isServiceAdvisor, AppointmentFilterDto filter, CancellationToken ct);

    // Lấy chi tiết appointment. Customer chỉ xem được của mình, SA xem tất cả
    Task<AppointmentDetailDto?> GetDetailAsync(int appointmentId, int currentUserId, bool isServiceAdvisor, CancellationToken ct);
    Task ApproveAsync(int appointmentId, int currentUserId, CancellationToken ct);
}
