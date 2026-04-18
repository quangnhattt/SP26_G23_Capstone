namespace AGMS.Application.DTOs.Appointments;

// Query filter parameters cho GET /api/appointments
public class AppointmentFilterDto
{
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? ServiceType { get; set; }
    public int? CarId { get; set; }
    public int? CustomerId { get; set; } // SA-only
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
