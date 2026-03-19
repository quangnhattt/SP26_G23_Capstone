namespace AGMS.Application.DTOs.Appointments;

// DTO cho màn danh sách appointments (Customer & SA)
public class AppointmentListItemDto
{
    public int AppointmentId { get; set; }
    public int CarId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string ServiceType { get; set; } = null!;
    public int? RequestedPackageId { get; set; }
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }

    // Car
    public string LicensePlate { get; set; } = null!;
    public string CarBrand { get; set; } = null!;
    public string CarModel { get; set; } = null!;
    public int CarYear { get; set; }
    public string? CarColor { get; set; }
    public int CurrentOdometer { get; set; }

    // Customer (CreatedBy user)
    public string CustomerFullName { get; set; } = null!;
    public string? CustomerPhone { get; set; }
    public string? Phone { get; set; }
    public string CustomerEmail { get; set; } = null!;

    // Package (nếu có)
    public string? PackageName { get; set; }
    public string? PackageCode { get; set; }
    public decimal? PackageFinalPrice { get; set; }
}
