using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.Intake
{
    public class IntakeUpdateRequest
    {
        [Required]
        public IntakeUpdateMaintenanceInfoDto Maintenance { get; set; } = null!;
        public IntakeUpdateCustomerInfo Customer { get; set; }
        public IntakeUpdateCarInfoDto? Car { get; set; }
        public IntakeUpdatePackageSelectionDto? PackageSelection { get; set; } = new();
        public List<IntakeUpdateServiceDetailItemDto> ServiceDetails { get; set; } = new();
        public List<IntakeUpdatePartDetailItemDto> PartDetails { get; set; } = new();
        public List<IntakeUpdateVehicleIntakeConditionItemDto> VehicleCondition { get; set; } = new();
    }
    public class IntakeUpdateMaintenanceInfoDto
    {
        [Required]
        [MaxLength(20)]
        public string MaintenanceType { get; set; } = "REGULAR"!;
        [MaxLength(500)]
        public string? Notes { get; set; }
        public int? AssignedTechnicianId { get; set; }
        public int? BayId { get; set; }
    }

    public class IntakeUpdatePackageSelectionDto
    {
        public int? SelectedPackageId { get; set; }
    }

    public class IntakeUpdateCustomerInfo
    {
        [MaxLength(100)]
        public string? FullName { get; set; }
        [MaxLength(20)]
        public string? Phone { get; set; }
        [MaxLength(100)]
        [EmailAddress]
        public string? Email { get; set; }
        [MaxLength(10)]
        public string? Gender { get; set; }
        public DateOnly? Dob { get; set; }
    }
    public class IntakeUpdateCarInfoDto
    {
        [MaxLength(20)]
        public string? LicensePlate { get; set; }
        [MaxLength(50)]
        public string? Brand { get; set; }
        [MaxLength(50)]
        public string? Model { get; set; }
        public int? Year { get; set; }
        [MaxLength(30)]
        public string? Color { get; set; }
        [MaxLength(50)]
        public string? EngineNumber { get; set; }
        [MaxLength(50)]
        public string? ChassisNumber { get; set; }
        public int? CurrentOdometer { get; set; }

    }
    public class IntakeUpdateServiceDetailItemDto
    {
        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }
        [Range(typeof(decimal), "0.01", "99999")]
        public decimal Quantity { get; set; }
        [MaxLength(255)]
        public string? Notes { get; set; }
    }

    public class IntakeUpdatePartDetailItemDto
    {
        [Range(1, int.MaxValue)]

        public int ProductId { get; set; }
        [Range(1, 99999)]

        public int Quantity { get; set; }
        [MaxLength(255)]

        public string? Notes { get; set; }

    }
    public class IntakeUpdateVehicleIntakeConditionItemDto
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
        public string? ConditionNotes { get; set; }
    }
}


