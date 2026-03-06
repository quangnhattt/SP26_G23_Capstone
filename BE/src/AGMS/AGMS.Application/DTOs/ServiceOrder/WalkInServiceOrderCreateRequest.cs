using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.ServiceOrder
{
    public class WalkInServiceOrderCreateRequest
    {
        [Required]
        public WalkInCustomerInputDto Customer { get; set; } = new();
        [Required]
        public WalkInCarInputDto Car { get; set; } = new();


        [Required]
        public WalkInMaintenanceInfoDto Maintenance { get; set; } = new();
        public WalkInPackageSelectionDto? PackageSelection { get; set; } = new();
        public List<WalkInServiceDetailItemDto> ServiceDetails { get; set; } = new();
        public List<WalkInPartDetailItemDto> PartDetails { get; set; } = new();
        public List<WalkInVehicleIntakeConditionItemDto> VehicleIntakeConditions { get; set; } = new();

    }
    public class WalkInCustomerInputDto
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
    public class WalkInCarInputDto
    {
        [Required]
        [MaxLength(20)]
        public string Mode { get; set; } = "existing"; // new | existing

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
    public class WalkInMaintenanceInfoDto
    {
        [Required]
        [MaxLength(20)]
        public string MaintenanceType { get; set; } = "REGULAR";
        [MaxLength(500)]
        public string? Notes { get; set; }
        public int? AssignedTechnicianId { get; set; }
        public int? BayId { get; set; }
    }
    public class WalkInPackageSelectionDto
    {
        public int? SelectedPackageId { get; set; }
    }
    public class WalkInServiceDetailItemDto
    {
        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }
        [Range(typeof(decimal), "0.01", "999999")]
        public decimal Quantity { get; set; }
        [MaxLength(255)]
        public string? Notes { get; set; }
    }
    public class WalkInPartDetailItemDto
    {
        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }
        [Range(1, 999999)]
        public int Quantity { get; set; }
        [MaxLength(255)]
        public string? Notes { get; set; }
    }
    public class WalkInVehicleIntakeConditionItemDto
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
    public class WalkInServiceOrderCreateResponseDto
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
}
