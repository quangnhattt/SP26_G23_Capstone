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
    public async Task<IEnumerable<MaintenancePackage>> GetAllOrderedByDisplayOrderAsync(CancellationToken ct = default)
    {
        return await _dbContext.MaintenancePackages.AsNoTracking().OrderBy(pd => pd.DisplayOrder).ToListAsync(ct);
    }

    public async Task<MaintenancePackage?> GetByPackageCodeAsync(string packageCode, CancellationToken ct = default)
    {
        return await _dbContext.MaintenancePackages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PackageCode == packageCode, ct);
    }

    public async Task<MaintenancePackage?> GetByDisplayOrderAsync(int displayOrder, CancellationToken ct = default)
    {
        return await _dbContext.MaintenancePackages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.DisplayOrder == displayOrder, ct);
    }

    public async Task<MaintenancePackage?> GetByIdAsync(int packageId, CancellationToken ct = default)
    {
        return await _dbContext.MaintenancePackages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PackageID == packageId, ct);
    }

    public async Task<MaintenancePackage> AddAsync(MaintenancePackage entity, CancellationToken ct = default)
    {
        _dbContext.MaintenancePackages.Add(entity);
        await _dbContext.SaveChangesAsync(ct);
        return entity;
    }
}
