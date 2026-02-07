using AGMS.Application.Contracts;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

using AppUser = AGMS.Application.Entities.User;
using DbUser = AGMS.Infrastructure.Persistence.Entities.User;

namespace AGMS.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly CarServiceDbContext _db;

    public UserRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<AppUser?> GetByEmailAsync(string email, CancellationToken ct)
    {
        var entity = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email, ct);
        return entity == null ? null : MapToApp(entity);
    }

    public async Task<AppUser?> GetByPhoneAsync(string phone, CancellationToken ct)
    {
        var entity = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Phone == phone, ct);
        return entity == null ? null : MapToApp(entity);
    }

    public async Task AddAsync(AppUser user, CancellationToken ct)
    {
        var entity = MapToPersistence(user);
        _db.Users.Add(entity);
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

    private static AppUser MapToApp(DbUser entity)
    {
        return new AppUser
        {
            UserID = entity.UserID,
            UserCode = entity.UserCode,
            FullName = entity.FullName,
            Username = entity.Username,
            PasswordHash = entity.PasswordHash,
            PasswordSalt = entity.PasswordSalt,
            Email = entity.Email,
            Phone = entity.Phone,
            RoleID = entity.RoleID,
            IsActive = entity.IsActive,
            CreatedDate = entity.CreatedDate
        };
    }

    private static DbUser MapToPersistence(AppUser app)
    {
        return new DbUser
        {
            UserID = app.UserID,
            UserCode = app.UserCode,
            FullName = app.FullName,
            Username = app.Username,
            PasswordHash = app.PasswordHash,
            PasswordSalt = app.PasswordSalt,
            Email = app.Email,
            Phone = app.Phone,
            RoleID = app.RoleID,
            IsActive = app.IsActive,
            CreatedDate = app.CreatedDate,
            Image = null,
            Gender = null,
            DateOfBirth = null,
            LastLoginDate = null,
            TotalSpending = 0,
            CurrentRankID = null,
            IsOnRescueMission = false,
            Skills = null
        };
    }
}
