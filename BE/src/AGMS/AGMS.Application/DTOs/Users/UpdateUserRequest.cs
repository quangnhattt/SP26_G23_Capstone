using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Users;

public class UpdateUserRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = null!;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [Required]
    public int RoleID { get; set; } // 2, 3, or 4 only

    public bool? IsActive { get; set; }
}