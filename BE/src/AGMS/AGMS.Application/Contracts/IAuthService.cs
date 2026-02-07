using AGMS.Application.DTOs.Auth;

namespace AGMS.Application.Contracts;

public interface IAuthService
{
    Task RegisterAsync(RegisterRequest req, CancellationToken ct);
    Task<LoginResponse> LoginAsync(LoginRequest req, CancellationToken ct);
    Task<ForgotPasswordOtpResponse> RequestForgotPasswordOtpAsync(ForgotPasswordRequest req, CancellationToken ct);
    Task ResetPasswordWithOtpAsync(ResetPasswordRequest req, CancellationToken ct);
}
