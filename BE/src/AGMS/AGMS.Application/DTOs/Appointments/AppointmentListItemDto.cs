namespace AGMS.Application.DTOs.Appointments;

/// <summary>
/// DTO for the appointment list screen (both Customer & SA).
/// </summary>
public class AppointmentListItemDto
{
    // ─── Appointment core ───
    public int AppointmentId { get; set; }
    public int CarId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string ServiceType { get; set; } = null!;
    public int? RequestedPackageId { get; set; }
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }

    // ─── Car summary ───
    public string LicensePlate { get; set; } = null!;
    public string CarBrand { get; set; } = null!;
    public string CarModel { get; set; } = null!;
    public int CarYear { get; set; }
    public string? CarColor { get; set; }
    public int CurrentOdometer { get; set; }

    // ─── Customer (CreatedBy user) ───
    public string CustomerFullName { get; set; } = null!;
    public string? CustomerPhone { get; set; }
    public string CustomerEmail { get; set; } = null!;

    // ─── Package (if any) ───
    public string? PackageName { get; set; }
    public string? PackageCode { get; set; }
    public decimal? PackageFinalPrice { get; set; }
}
