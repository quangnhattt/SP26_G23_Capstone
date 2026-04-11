using AGMS.Application.Contracts;

namespace AGMS.Infrastructure.Persistence.Db;

/// <summary>
/// Adapter transaction dùng chung cho service layer nhưng vẫn giữ chi tiết EF Core trong infrastructure.
/// </summary>
public class TransactionManager : ITransactionManager
{
    private readonly CarServiceDbContext _db;

    public TransactionManager(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> action,
        CancellationToken ct
    )
    {
        if (_db.Database.CurrentTransaction != null)
        {
            await action(ct);
            return;
        }

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            await action(ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
