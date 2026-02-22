using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MaintenanacePackage;

namespace AGMS.Infrastructure.Services;

public class MaintenancePackageService : IMaintenancePackageService
{
    private readonly IMaintenancePackageRepository _repository;

    public MaintenancePackageService(IMaintenancePackageRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<PackageWithProductsDto>> GetPackagesWithActiveProductDetailsAsync(CancellationToken ct = default)
    {
        var list = await _repository.GetPackagesWithActiveProductDetailsAsync(ct);

        return list
            .GroupBy(pd => new
            {
                pd.Package.PackageCode,
                pd.Package.Name,
                pd.Package.FinalPrice
            })
            .Select(g => new PackageWithProductsDto
            {
                PackageCode = g.Key.PackageCode,
                PackageName = g.Key.Name,
                PackageTotalPrice = g.Key.FinalPrice,
                Products = g
                    .OrderBy(pd => pd.DisplayOrder)
                    .Select(pd => new PackageProductItemDto
                    {
                        ProductID = pd.ProductID,
                        ProductName = pd.Product.Name,
                        Quantity = pd.Quantity,
                        ProductStatus = pd.Product.IsActive,
                        DisplayOrder = pd.DisplayOrder
                    })
                    .ToList()
            })
            .ToList();
    }
}
