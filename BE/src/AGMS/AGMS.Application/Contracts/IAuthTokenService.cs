namespace AGMS.Application.Contracts;

public interface IAuthTokenService
{
    (string token, DateTime expiresAtUtc) GenerateToken(int userId, string email, string fullName);
}
