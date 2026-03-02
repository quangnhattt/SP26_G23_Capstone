using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Users;

public class UpdateMyProfileRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = null!;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    [MaxLength(255)]
    public string? Image { get; set; }

    public DateOnly? DateOfBirth { get; set; }
}

