using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Auth;

public class EmailVerificationSendOtpRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
}

