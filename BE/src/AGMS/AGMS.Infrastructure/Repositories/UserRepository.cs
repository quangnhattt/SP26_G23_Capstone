using AGMS.Application.Contracts;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly CarServiceDbContext _db;

    public UserRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email, ct);
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == username, ct);
    }

    public async Task<User?> GetByPhoneAsync(string phone, CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Phone == phone, ct);
    }

    public async Task AddAsync(User user, CancellationToken ct)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdatePasswordAsync(int userId, string passwordHash, string? passwordSalt, CancellationToken ct)
    {
        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
        if (entity == null) return;

        entity.PasswordHash = passwordHash;
        entity.PasswordSalt = passwordSalt;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<User>> GetUsersExceptAdminAsync(CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Where(u => u.RoleID != 1)
            .OrderBy(u => u.UserID)
            .ToListAsync(ct);
    }

    public async Task<User?> GetByIdAsync(int userId, CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.CurrentRank)
            .FirstOrDefaultAsync(u => u.UserID == userId, ct);
    }

    public async Task<IEnumerable<User>> SearchUsersExceptAdminAsync(string? q, string? phone, int? roleId, bool? isActive, CancellationToken ct)
    {
        var query = _db.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Where(u => u.RoleID != 1);

        if (!string.IsNullOrWhiteSpace(q))
        {
            query = query.Where(u =>
                (u.FullName != null && u.FullName.Contains(q)) ||
                (u.Email != null && u.Email.Contains(q)) ||
                (u.Phone != null && u.Phone.Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var normalizedPhone = phone.Trim();
            query = query.Where(u => u.Phone != null && u.Phone.Contains(normalizedPhone));
        }

        if (roleId.HasValue)
        {
            query = query.Where(u => u.RoleID == roleId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        return await query
            .OrderBy(u => u.UserID)
            .ToListAsync(ct);
    }

    public async Task UpdateAsync(User user, CancellationToken ct)
    {
        var entity = await _db.Users
            .FirstOrDefaultAsync(u => u.UserID == user.UserID, ct);

        if (entity == null) return;

        // Chỉ cập nhật các trường được phép chỉnh sửa
        entity.FullName   = user.FullName;
        entity.Email      = user.Email;
        entity.Username   = user.Username;
        entity.Phone      = user.Phone;
        entity.Gender     = user.Gender;
        entity.DateOfBirth = user.DateOfBirth;
        entity.Image      = user.Image;
        entity.RoleID     = user.RoleID;
        entity.IsActive   = user.IsActive;

        await _db.SaveChangesAsync(ct);
    }


    public async Task SetActiveAsync(int userId, bool isActive, CancellationToken ct)
    {
        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
        if (entity == null) return;

        entity.IsActive = isActive;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int userId, CancellationToken ct)
	{
		var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
        if (entity == null) return;
		_db.Users.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }

		
    /// <summary>
    /// Bật/tắt cờ nhiệm vụ cứu hộ của kỹ thuật viên (BR-28).
    /// Dùng khi assign (true) hoặc hoàn thành/hủy nhiệm vụ (false).
    /// </summary>
    public async Task SetOnRescueMissionAsync(int userId, bool isOnMission, CancellationToken ct)
    {
        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
        if (entity == null) return;
        entity.IsOnRescueMission = isOnMission;
        await _db.SaveChangesAsync(ct);
    }

    public async Task SetEmailVerifiedAsync(int userId, bool isVerified, CancellationToken ct)
    {
        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
        if (entity == null) return;
		entity.IsEmailVerified = isVerified;
        await _db.SaveChangesAsync(ct);
    }

    public async Task IncrementTrustScoreAsync(int userId, CancellationToken ct)
    {
        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
        if (entity == null) return;

        // Điểm tin cậy chỉ tăng từ rescue đã hoàn tất, nên hàm này chỉ được gọi sau thanh toán cuối.
        entity.TrustScore += 1;
        await _db.SaveChangesAsync(ct);
    }
    public async Task DecrementTrustScoreAsync(int userId, CancellationToken ct)
    {
        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
        if (entity == null) return;

        // Trừ điểm tin cậy khi khách hủy kéo xe sau khi xe kéo đã tới hiện trường.
        entity.TrustScore = Math.Max(0, entity.TrustScore - 1);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<int> GetTotalRepairsCountByUserIdAsync(int userId, CancellationToken ct)
    {
        return await _db.CarMaintenances
            .Where(cm => cm.Car.OwnerID == userId && cm.Status == "CLOSED")
            .CountAsync(ct);
    }
}
