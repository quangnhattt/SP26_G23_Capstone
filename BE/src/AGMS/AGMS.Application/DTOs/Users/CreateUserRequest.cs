using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Users;

public class CreateUserRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = null!;

    [Required]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = null!;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [Required]
    public int RoleID { get; set; } // 2, 3, or 4 only

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = null!;

    [Required]
    public string ConfirmPassword { get; set; } = null!;
}