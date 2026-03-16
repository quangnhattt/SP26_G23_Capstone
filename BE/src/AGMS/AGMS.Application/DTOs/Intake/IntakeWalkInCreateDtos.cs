using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Intake;

public class IntakeWalkInCreateRequest
{
    [Required]
    public IntakeWalkInCustomerInputDto Customer { get; set; } = new();

    [Required]
    public IntakeWalkInCarInputDto Car { get; set; } = new();

    [Required]
    public IntakeWalkInMaintenanceInfoDto Maintenance { get; set; } = new();

    public IntakeWalkInPackageSelectionDto? PackageSelection { get; set; } = new();
    public List<IntakeWalkInServiceDetailItemDto> ServiceDetails { get; set; } = new();
    public List<IntakeWalkInPartDetailItemDto> PartDetails { get; set; } = new();
    public List<IntakeWalkInVehicleIntakeConditionItemDto> VehicleIntakeConditions { get; set; } = new();
}

public class IntakeWalkInCustomerInputDto
{
    [Required]
    public string Mode { get; set; } = "existing";

    public int? CustomerId { get; set; }

    [MaxLength(100)]
    public string? FullName { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }
}

public class IntakeWalkInCarInputDto
{
    [Required]
    [MaxLength(20)]
    public string Mode { get; set; } = "existing";

    public int? CarId { get; set; }

    [MaxLength(20)]
    public string? LicensePlate { get; set; }

    [MaxLength(50)]
    public string? Brand { get; set; }

    [MaxLength(50)]
    public string? Model { get; set; }

    public int? Year { get; set; }
    public int? CurrentOdometer { get; set; }

    [MaxLength(30)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? EngineNumber { get; set; }

    [MaxLength(50)]
    public string? ChassisNumber { get; set; }
}

public class IntakeWalkInMaintenanceInfoDto
{
    [Required]
    [MaxLength(20)]
    public string MaintenanceType { get; set; } = "MAINTENANCE";

    [MaxLength(500)]
    public string? Notes { get; set; }

    public int? AssignedTechnicianId { get; set; }
    public int? BayId { get; set; }
}

public class IntakeWalkInPackageSelectionDto
{
    public int? SelectedPackageId { get; set; }
}

public class IntakeWalkInServiceDetailItemDto
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(typeof(decimal), "0.01", "999999")]
    public decimal Quantity { get; set; }

    [MaxLength(255)]
    public string? Notes { get; set; }
}

public class IntakeWalkInPartDetailItemDto
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, 999999)]
    public int Quantity { get; set; }

    [MaxLength(255)]
    public string? Notes { get; set; }
}

public class IntakeWalkInVehicleIntakeConditionItemDto
{
    [MaxLength(255)]
    public string? FrontStatus { get; set; }

    [MaxLength(255)]
    public string? RearStatus { get; set; }

    [MaxLength(255)]
    public string? LeftStatus { get; set; }

    [MaxLength(255)]
    public string? RightStatus { get; set; }

    [MaxLength(255)]
    public string? RoofStatus { get; set; }

    public string? ConditionNote { get; set; }
}

public class IntakeWalkInCreateResponseDto
{
    public int MaintenanceId { get; set; }
    public int CustomerId { get; set; }
    public int CarId { get; set; }
    public int? SelectedPackageId { get; set; }
    public decimal TotalAmount { get; set; }
    public int ServiceDetailsCount { get; set; }
    public int PartDetailsCount { get; set; }
    public int VehicleIntakeConditionsCount { get; set; }
    public DateTime CreatedDateUtc { get; set; }
}
