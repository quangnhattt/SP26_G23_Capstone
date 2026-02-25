using AGMS.Application.DTOs.MaintenanacePackage;

namespace AGMS.Application.Contracts;

public interface IMaintenancePackageService
{
    Task<IEnumerable<MaintenancePackageListItemDto>> GetAllPackagesAsync(CancellationToken ct = default);
    Task<MaintenancePackageListItemDto> CreateAsync(CreateMaintenancePackageRequest request, CancellationToken ct = default);
    Task<MaintenancePackageByIdDto> UpdateAsync(int packageId, UpdateMaintenancePackageRequest request, CancellationToken ct = default);
    Task<MaintenancePackageByIdDto> GetByIdAsync(int packageId, CancellationToken ct = default);
    Task<MaintenancePackageDetailDto> GetByIdWithActiveProductsAsync(int packageId, CancellationToken ct = default);
    Task SetActiveStatusAsync(int packageId, bool isActive, CancellationToken ct = default);
}

