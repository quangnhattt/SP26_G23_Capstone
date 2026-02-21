using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Users;

public class CreateUserRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = null!;

    /// <summary>
    /// Username chosen by admin/user (must be unique and not equal to Email).
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Username { get; set; } = null!;

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

    [MaxLength(20)]
    public string? Gender { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    [MaxLength(255)]
    public string? Image { get; set; }
}