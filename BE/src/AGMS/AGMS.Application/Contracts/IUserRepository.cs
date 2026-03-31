using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<User?> GetByUsernameAsync(string username, CancellationToken ct);
    Task<User?> GetByPhoneAsync(string phone, CancellationToken ct);
    Task AddAsync(User user, CancellationToken ct);
    Task UpdatePasswordAsync(int userId, string passwordHash, string? passwordSalt, CancellationToken ct);
        Task<IEnumerable<User>> GetUsersExceptAdminAsync(CancellationToken ct);
    Task<User?> GetByIdAsync(int userId, CancellationToken ct);
    Task<IEnumerable<User>> SearchUsersExceptAdminAsync(string? q, string? phone, int? roleId, bool? isActive, CancellationToken ct);
    Task UpdateAsync(User user, CancellationToken ct);
    Task SetActiveAsync(int userId, bool isActive, CancellationToken ct);
    Task DeleteAsync(int userId, CancellationToken ct);
    Task SetEmailVerifiedAsync(int userId, bool isVerified, CancellationToken ct);
    Task IncrementTrustScoreAsync(int userId, CancellationToken ct);
    /// <summary>
    /// Cập nhật cờ IsOnRescueMission của kỹ thuật viên — dùng khi assign/release nhiệm vụ cứu hộ
    /// </summary>
    Task SetOnRescueMissionAsync(int userId, bool isOnMission, CancellationToken ct);
}
