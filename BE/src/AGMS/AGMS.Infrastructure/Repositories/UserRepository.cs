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
}
