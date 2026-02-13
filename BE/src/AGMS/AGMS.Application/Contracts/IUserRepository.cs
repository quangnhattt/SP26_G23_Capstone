using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<User?> GetByPhoneAsync(string phone, CancellationToken ct);
    Task AddAsync(User user, CancellationToken ct);
    Task UpdatePasswordAsync(int userId, string passwordHash, string? passwordSalt, CancellationToken ct);
        Task<IEnumerable<User>> GetUsersExceptAdminAsync(CancellationToken ct);
  Task<User?> GetByIdAsync(int userId, CancellationToken ct);
    Task<IEnumerable<User>> SearchUsersExceptAdminAsync(string? q, int? roleId, bool? isActive, CancellationToken ct);
    Task UpdateAsync(User user, CancellationToken ct);
    Task SetActiveAsync(int userId, bool isActive, CancellationToken ct);
}
