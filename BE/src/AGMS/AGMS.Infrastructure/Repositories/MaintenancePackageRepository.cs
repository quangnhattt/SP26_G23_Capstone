using AGMS.Application.Contracts;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class MaintenancePackageRepository : IMaintenancePackageRepository
{
    private readonly CarServiceDbContext _dbContext;

    public MaintenancePackageRepository(CarServiceDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<MaintenancePackageDetail>> GetPackagesWithActiveProductDetailsAsync(CancellationToken ct = default)
    {
        return await _dbContext.MaintenancePackageDetails
            .AsNoTracking()
            .Include(pd => pd.Package)
            .Include(pd => pd.Product)
            .Where(pd => pd.Product != null && pd.Product.IsActive)
            .OrderBy(pd => pd.PackageID)
            .ThenBy(pd => pd.DisplayOrder)
            .ToListAsync(ct);
    }
}
