using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Auth;

public class EmailVerificationVerifyOtpRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    [MaxLength(6)]
    [MinLength(4)]
    public string Otp { get; set; } = null!;
}

