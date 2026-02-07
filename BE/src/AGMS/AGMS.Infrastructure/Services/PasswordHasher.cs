using System.Security.Cryptography;
using System.Text;
using AGMS.Application.Contracts;

namespace AGMS.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100000;

    public (string hash, string? salt) Hash(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            saltBytes,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);
        var hashB64 = Convert.ToBase64String(hash);
        var saltB64 = Convert.ToBase64String(saltBytes);
        return (hashB64, saltB64);
    }

    public bool Verify(string password, string hash, string? salt)
    {
        if (string.IsNullOrEmpty(salt))
            return false;
        var saltBytes = Convert.FromBase64String(salt);
        var expectedHash = Convert.FromBase64String(hash);
        var actualHash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            saltBytes,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);
        return CryptographicOperations.FixedTimeEquals(expectedHash, actualHash);
    }
}
