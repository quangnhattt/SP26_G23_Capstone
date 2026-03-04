namespace AGMS.Application.DTOs.Appointments;

/// <summary>
/// Query filter parameters for GET /api/appointments.
/// </summary>
public class AppointmentFilterDto
{
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? ServiceType { get; set; }
    public int? CarId { get; set; }

    /// <summary>
    /// SA-only: filter by a specific customer's userId.
    /// </summary>
    public int? CustomerId { get; set; }
}
