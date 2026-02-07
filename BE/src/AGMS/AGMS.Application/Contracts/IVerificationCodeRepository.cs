using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IVerificationCodeRepository
{
    Task CreateAsync(string contactInfo, string code, string type, DateTime expiryTimeUtc, CancellationToken ct);
    Task<VerificationCode?> GetValidAsync(string contactInfo, string code, string type, DateTime nowUtc, CancellationToken ct);
    Task MarkUsedAsync(int id, CancellationToken ct);
}
