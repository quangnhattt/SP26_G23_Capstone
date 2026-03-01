using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.MaintenanacePackage;

public class UpdateMaintenancePackageRequest
{
    [Required(ErrorMessage = "PackageCode is required.")]
    [StringLength(50)]
    public string PackageCode { get; set; } = null!;

    [Required(ErrorMessage = "Name is required.")]
    [StringLength(200)]
    public string Name { get; set; } = null!;

    [StringLength(500)]
    public string? Description { get; set; }

    [Range(0, 999999, ErrorMessage = "KilometerMilestone cannot be negative.")]
    [DefaultValue(0)]
    public int KilometerMilestone { get; set; }

    [Range(0, 999, ErrorMessage = "MonthMilestone cannot be negative.")]
    [DefaultValue(0)]
    public int MonthMilestone { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "BasePrice cannot be negative.")]
    public decimal BasePrice { get; set; }

    [Required]
    [Range(0, 100, ErrorMessage = "DiscountPercent must be between 0 and 100.")]
    public decimal DiscountPercent { get; set; }

    public decimal? EstimatedDurationHours { get; set; }

    [StringLength(500)]
    public string? ApplicableBrands { get; set; }

    public string? Image { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "DisplayOrder cannot be negative.")]
    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;
}

