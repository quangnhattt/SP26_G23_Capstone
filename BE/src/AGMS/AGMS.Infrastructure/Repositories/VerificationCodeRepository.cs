using AGMS.Application.Contracts;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

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
        var entity = new VerificationCode
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

    public async Task<VerificationCode?> GetValidAsync(string contactInfo, string code, string type, DateTime nowUtc, CancellationToken ct)
    {
        return await _db.VerificationCodes
            .AsNoTracking()
            .FirstOrDefaultAsync(
                v => v.ContactInfo == contactInfo
                     && v.Code == code
                     && v.Type == type
                     && v.ExpiryTime > nowUtc
                     && !v.IsUsed,
                ct);
    }

    public async Task MarkUsedAsync(int id, CancellationToken ct)
    {
        var entity = await _db.VerificationCodes.FirstOrDefaultAsync(v => v.Id == id, ct);
        if (entity == null) return;
        entity.IsUsed = true;
        await _db.SaveChangesAsync(ct);
    }
}
