using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Category;

public class UpdateCategoryStatusRequest
{
    [Required]
    public bool IsActive { get; set; }
}
