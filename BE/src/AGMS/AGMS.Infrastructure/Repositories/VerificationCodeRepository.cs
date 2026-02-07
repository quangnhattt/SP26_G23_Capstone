using AGMS.Application.Contracts;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

using AppVerificationCode = AGMS.Application.Entities.VerificationCode;
using DbVerificationCode = AGMS.Infrastructure.Persistence.Entities.VerificationCode;

namespace AGMS.Infrastructure.Repositories;

public class VerificationCodeRepository : IVerificationCodeRepository
{
    private readonly CarServiceDbContext _db;

    public VerificationCodeRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task CreateAsync(string contactInfo, string code, string type, DateTime expiryTimeUtc, CancellationToken ct)
    {
        var entity = new DbVerificationCode
        {
            ContactInfo = contactInfo,
            Code = code,
            Type = type,
            ExpiryTime = expiryTimeUtc,
            IsUsed = false,
            CreatedDate = DateTime.UtcNow
        };
        _db.VerificationCodes.Add(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AppVerificationCode?> GetValidAsync(string contactInfo, string code, string type, DateTime nowUtc, CancellationToken ct)
    {
        var entity = await _db.VerificationCodes
            .AsNoTracking()
            .FirstOrDefaultAsync(
                v => v.ContactInfo == contactInfo
                     && v.Code == code
                     && v.Type == type
                     && v.ExpiryTime > nowUtc
                     && !v.IsUsed,
                ct);
        return entity == null ? null : MapToApp(entity);
    }

    public async Task MarkUsedAsync(int id, CancellationToken ct)
    {
        var entity = await _db.VerificationCodes.FirstOrDefaultAsync(v => v.Id == id, ct);
        if (entity == null) return;
        entity.IsUsed = true;
        await _db.SaveChangesAsync(ct);
    }

    private static AppVerificationCode MapToApp(DbVerificationCode entity)
    {
        return new AppVerificationCode
        {
            Id = entity.Id,
            ContactInfo = entity.ContactInfo,
            Code = entity.Code,
            Type = entity.Type,
            ExpiryTime = entity.ExpiryTime,
            IsUsed = entity.IsUsed,
            CreatedDate = entity.CreatedDate
        };
    }
}
