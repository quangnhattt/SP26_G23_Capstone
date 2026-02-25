using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IMaintenancePackageRepository
{
    Task<IEnumerable<MaintenancePackageDetail>> GetPackagesWithActiveProductDetailsAsync(CancellationToken ct = default);
    Task<IEnumerable<MaintenancePackage>> GetAllOrderedByDisplayOrderAsync(CancellationToken ct = default);
    Task<MaintenancePackage?> GetByPackageCodeAsync(string packageCode, CancellationToken ct = default);
    Task<MaintenancePackage?> GetByDisplayOrderAsync(int displayOrder, CancellationToken ct = default);
    Task<MaintenancePackage?> GetByIdAsync(int packageId, CancellationToken ct = default);
    Task<MaintenancePackage> AddAsync(MaintenancePackage entity, CancellationToken ct = default);
    Task UpdateAsync(MaintenancePackage entity, CancellationToken ct = default);
}