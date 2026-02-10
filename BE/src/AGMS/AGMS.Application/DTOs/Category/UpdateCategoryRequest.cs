using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Category;

public class UpdateCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    [Required]
    public string Type { get; set; } = null!; // "Service" or "Part"

    [MaxLength(255)]
    public string? Description { get; set; }
}
