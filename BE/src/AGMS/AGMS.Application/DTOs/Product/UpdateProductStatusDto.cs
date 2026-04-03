using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Product;

public class UpdateProductStatusDto
{
    [Required]
    public bool IsActive { get; set; }
}
