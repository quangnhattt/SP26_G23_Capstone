namespace AGMS.Application.DTOs.ServiceOrder;

public class ServiceOrderIntakeDetailDto
{
    public int MaintenanceId { get; set; }
    public DateTime MaintenanceDate { get; set; }
    public string MaintenanceStatus { get; set; } = null!;

    public int? TechnicianId { get; set; }
    public string? TechnicianName { get; set; }
    public string? TechnicianPhone { get; set; }
    public string? TechnicianEmail { get; set; }    
    public IntakeCustomerDto Customer { get; set; } = null!;
    public IntakeCarDto Car { get; set; } = null!;
    public IntakePackageDto? Package { get; set; }

    public List<IntakeServiceItemDto> ServiceDetails { get; set; } = new();
    public List<IntakePartItemDto> PartDetails { get; set; } = new();
    public List<IntakeConditionItemDto> VehicleIntakeConditions { get; set; } = new();
}

public class IntakeCustomerDto
{
    public string UserCode { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public DateOnly? Dob { get; set; }
}

public class IntakeCarDto
{
    public string LicensePlate { get; set; } = null!;
    public string? Brand { get; set; }  
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? Color { get; set; }  
    public string CarDetails { get; set; } = null!;
    public string? EngineNumber { get; set; }
    public string? ChassisNumber { get; set; }
    public int CurrentOdometer { get; set; }
}

public class IntakePackageDto
{
    public int PackageId { get; set; }
    public string PackageCode { get; set; } = null!;
    public string PackageName { get; set; } = null!;
    public decimal PackagePrice { get; set; }
}

public class IntakeServiceItemDto
{
    public int ServiceProductId { get; set; }
    public string ServiceProductCode { get; set; } = null!;
    public string ServiceProductName { get; set; } = null!;
    public decimal ServiceQty { get; set; }
    public decimal ServicePrice { get; set; }
    public string ServiceStatus { get; set; } = null!;
    public bool IsServiceAdditional { get; set; }
    public string? ServiceNotes { get; set; }
}

public class IntakePartItemDto
{
    public int PartProductId { get; set; }
    public string PartProductCode { get; set; } = null!;
    public string PartProductName { get; set; } = null!;
    public int PartQty { get; set; }
    public decimal PartPrice { get; set; }
    public string PartStatus { get; set; } = null!;
    public bool IsPartAdditional { get; set; }
    public string? PartNotes { get; set; }
}

public class IntakeConditionItemDto
{
    public int IntakeConditionId { get; set; }
    public DateTime CheckInTime { get; set; }
    public string? FrontStatus { get; set; }
    public string? RearStatus { get; set; }
    public string? LeftStatus { get; set; }
    public string? RightStatus { get; set; }
    public string? RoofStatus { get; set; }
    public string? IntakeConditionNote { get; set; }
}
