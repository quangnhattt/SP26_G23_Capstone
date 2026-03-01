using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.MaintenanacePackage;

public class AddPackageProductRequest
{
    [Required]
    public int ProductId { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; } = 1;

    public bool IsRequired { get; set; } = true;

    /// <summary>
    /// Optional. If not provided, it will be auto-calculated. When provided, must be > 0.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "DisplayOrder must be greater than zero.")]
    public int? DisplayOrder { get; set; }
}

