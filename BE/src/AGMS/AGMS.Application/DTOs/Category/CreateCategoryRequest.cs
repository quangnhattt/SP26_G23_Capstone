using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Category;

public class CreateCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    [Required]
    public string Type { get; set; } = null!; // "Service" or "Part"

    [MaxLength(255)]
    public string? Description { get; set; }

    [Range(0, 100, ErrorMessage = "MarkupPercent must be between 0 and 1000.")]
    public decimal MarkupPercent { get; set; } = 0;
}
