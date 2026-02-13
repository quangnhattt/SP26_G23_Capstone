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
            .FirstOrDefaultAsync(u => u.UserID == userId, ct);
    }

    public async Task<IEnumerable<User>> SearchUsersExceptAdminAsync(string? q, int? roleId, bool? isActive, CancellationToken ct)
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
        _db.Users.Update(user);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SetActiveAsync(int userId, bool isActive, CancellationToken ct)
    {
        var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
        if (entity == null) return;

        entity.IsActive = isActive;
        await _db.SaveChangesAsync(ct);
    }
}