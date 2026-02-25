using AGMS.Application.DTOs.MaintenanacePackage;

namespace AGMS.Application.Contracts;

public interface IMaintenancePackageService
{
    Task<IEnumerable<PackageWithProductsDto>> GetPackagesWithActiveProductDetailsAsync(CancellationToken ct = default);
    Task<IEnumerable<MaintenancePackageListItemDto>> GetAllPackagesAsync(CancellationToken ct = default);
    Task<MaintenancePackageListItemDto> CreateAsync(CreateMaintenancePackageRequest request, CancellationToken ct = default);
    Task<MaintenancePackageListItemDto> UpdateAsync(int packageId, UpdateMaintenancePackageRequest request, CancellationToken ct = default);
}

