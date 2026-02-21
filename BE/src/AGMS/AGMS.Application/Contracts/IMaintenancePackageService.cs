using AGMS.Application.DTOs.MaintenanacePackage;

namespace AGMS.Application.Contracts
{
    public interface IMaintenancePackageService
    {
        Task<IEnumerable<PackageWithProductsDto>> GetPackagesWithActiveProductDetailsAsync(CancellationToken ct = default);
    }
}
