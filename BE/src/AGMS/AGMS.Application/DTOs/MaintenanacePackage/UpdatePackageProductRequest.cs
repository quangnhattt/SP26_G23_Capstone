using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.MaintenanacePackage
{
    public class UpdatePackageProductRequest
    {
        [Required]
        public int ProductId { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
        public decimal Quantity { get; set; } = 1;

        public bool IsRequired { get; set; } = true;

        [Range(1, int.MaxValue, ErrorMessage = "DisplayOrder must be greater than zero.")]
        public int? DisplayOrder { get; set; }
    }
}
