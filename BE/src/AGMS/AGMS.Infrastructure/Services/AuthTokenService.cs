using AGMS.Application.Contracts;

namespace AGMS.Infrastructure.Services;

public class AuthTokenService : IAuthTokenService
{
    private const int TokenValidHours = 24;

    public (string token, DateTime expiresAtUtc) GenerateToken(int userId, string email, string fullName)
    {
        var expiresAtUtc = DateTime.UtcNow.AddHours(TokenValidHours);
        var payload = $"{userId}:{email}:{fullName}:{expiresAtUtc:O}";
        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(payload));
        return (token, expiresAtUtc);
    }
}
