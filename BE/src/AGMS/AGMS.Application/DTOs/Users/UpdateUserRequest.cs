using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Users;

public class UpdateUserRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = null!;

    /// <summary>
    /// UserCode is treated as read-only. If provided and different, the request will be rejected.
    /// </summary>
    [MaxLength(50)]
    public string? UserCode { get; set; }

    [MaxLength(200)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [Required]
    public int RoleID { get; set; } // 2, 3, or 4 only

    public bool? IsActive { get; set; }

    [MaxLength(200)]
    public string? Username { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    [MaxLength(255)]
    public string? Image { get; set; }

    public DateOnly? DateOfBirth { get; set; }
}