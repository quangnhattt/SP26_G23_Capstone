namespace AGMS.Application.DTOs.Auth;

public class ForgotPasswordOtpResponse
{
    public string Otp { get; set; } = null!;
    public DateTime ExpiresAtUtc { get; set; }
}
