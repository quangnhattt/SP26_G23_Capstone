namespace AGMS.Application.DTOs.Appointments;

// DTO chi tiết appointment (detail screen)
public class AppointmentDetailDto
{
    public int AppointmentId { get; set; }
    public int CarId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string ServiceType { get; set; } = null!;
    public int? RequestedPackageId { get; set; }
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? ConfirmedBy { get; set; }
    public DateTime? ConfirmedDate { get; set; }

    public CarInfoDto Car { get; set; } = null!;
    public CustomerInfoDto Customer { get; set; } = null!;
    public PackageInfoDto? Package { get; set; }
    public CarMaintenanceInfoDto? Maintenance { get; set; }
}

public class CarInfoDto
{
    public int CarId { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? Color { get; set; }
    public int CurrentOdometer { get; set; }
}

public class CustomerInfoDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string? Phone { get; set; }
    public string Email { get; set; } = null!;
}

public class PackageInfoDto
{
    public int PackageId { get; set; }
    public string PackageName { get; set; } = null!;
    public string PackageCode { get; set; } = null!;
    public decimal? FinalPrice { get; set; }
}

public class CarMaintenanceInfoDto
{
    public int MaintenanceId { get; set; }
    public string MaintenanceType { get; set; } = null!;
    public int? AssignedTechnicianId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal? FinalAmount { get; set; }
    public string Status { get; set; } = null!;
}
