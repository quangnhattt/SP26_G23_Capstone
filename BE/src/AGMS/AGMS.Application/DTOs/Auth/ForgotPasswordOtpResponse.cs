namespace AGMS.Application.DTOs.Auth;

public class ForgotPasswordOtpResponse
{
    /// <summary>
    /// Human-readable message describing the result of the OTP request.
    /// For security reasons, the actual OTP code is never returned to the client.
    /// </summary>
    public string Message { get; set; } = null!;

    /// <summary>
    /// When the generated OTP will expire (UTC).
    /// </summary>
    public DateTime ExpiresAtUtc { get; set; }
}
