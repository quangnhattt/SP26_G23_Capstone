namespace AGMS.Application.DTOs.Auth;

public class ResetPasswordRequest
{
    public string Email { get; set; } = null!;
    public string Otp { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
    public string ConfirmNewPassword { get; set; } = null!;
}
