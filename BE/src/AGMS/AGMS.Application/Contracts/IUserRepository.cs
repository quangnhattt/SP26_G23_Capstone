using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<User?> GetByPhoneAsync(string phone, CancellationToken ct);
    Task AddAsync(User user, CancellationToken ct);
    Task UpdatePasswordAsync(int userId, string passwordHash, string? passwordSalt, CancellationToken ct);
}
