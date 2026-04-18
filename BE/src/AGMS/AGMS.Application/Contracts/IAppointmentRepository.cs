using AGMS.Application.DTOs.Appointments;
using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IAppointmentRepository
{
    // Lấy danh sách appointments theo bộ lọc. ownerUserId != null → chỉ trả appointment của user đó
    Task<AppointmentPagedResultDto<AppointmentListItemDto>> GetListAsync(int? ownerUserId, AppointmentFilterDto filter, CancellationToken ct);

    // Lấy appointment theo ID kèm navigation (Car, CreatedBy, Package, CarMaintenances). ownerUserId != null → chỉ trả nếu thuộc user đó
    Task<Appointment?> GetByIdAsync(int appointmentId, int? ownerUserId, CancellationToken ct);

    // Lấy RoleID của user theo userId
    Task<int?> GetUserRoleIdAsync(int userId, CancellationToken ct);
    Task ApproveAsync(int appointmentId, int approvedByUserId, CancellationToken ct);
    Task RejectAsync(int appointmentId, int rejectedByUserId, string rejectionReason, CancellationToken ct);
    Task ProposeRescheduleAsync(int appointmentId, string reason, CancellationToken ct);
    Task RespondRescheduleAsync(int appointmentId, bool accept, string? newDate, string? newTime, string? notes, CancellationToken ct);
    Task CheckInAsync(int appointmentId, int checkedInByUserId, CancellationToken ct);

}
