using AGMS.Application.DTOs.Appointments;

namespace AGMS.Application.Contracts;

public interface IAppointmentService
{
    /// <summary>
    /// Get a filtered/paged list of appointments.
    /// Customer sees only their own; SA sees all.
    /// </summary>
    Task<IEnumerable<AppointmentListItemDto>> GetListAsync(
        int currentUserId,
        bool isServiceAdvisor,
        AppointmentFilterDto filter,
        CancellationToken ct);

    /// <summary>
    /// Get full appointment detail by id.
    /// Customer can only access their own; SA can access any.
    /// </summary>
    Task<AppointmentDetailDto?> GetDetailAsync(
        int appointmentId,
        int currentUserId,
        bool isServiceAdvisor,
        CancellationToken ct);
}
