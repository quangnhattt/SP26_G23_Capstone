using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Auth;

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}
