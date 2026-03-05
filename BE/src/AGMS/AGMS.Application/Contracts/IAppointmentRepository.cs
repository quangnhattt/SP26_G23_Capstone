using AGMS.Application.DTOs.Appointments;
using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IAppointmentRepository
{
    // Lấy danh sách appointments theo bộ lọc. ownerUserId != null → chỉ trả appointment của user đó
    Task<IEnumerable<AppointmentListItemDto>> GetListAsync(int? ownerUserId, AppointmentFilterDto filter, CancellationToken ct);

    // Lấy appointment theo ID kèm navigation (Car, CreatedBy, Package, CarMaintenances). ownerUserId != null → chỉ trả nếu thuộc user đó
    Task<Appointment?> GetByIdAsync(int appointmentId, int? ownerUserId, CancellationToken ct);

    // Lấy RoleID của user theo userId
    Task<int?> GetUserRoleIdAsync(int userId, CancellationToken ct);
}
