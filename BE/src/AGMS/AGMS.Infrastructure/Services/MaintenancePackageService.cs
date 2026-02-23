using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MaintenanacePackage;
using AGMS.Application.Exceptions;
using AGMS.Domain.Entities;

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
    public async Task<IEnumerable<MaintenancePackageListItemDto>> GetAllPackagesAsync(CancellationToken ct = default)
    {
        var list = await _repository.GetAllOrderedByDisplayOrderAsync(ct);
        return list.Select(p => new MaintenancePackageListItemDto
        {
            PackageID = p.PackageID,
            PackageCode = p.PackageCode,
            Name = p.Name,
            Description = p.Description,
            KilometerMilestone = p.KilometerMilestone,
            BasePrice = p.BasePrice,
            DiscountPercent = p.DiscountPercent,
            FinalPrice = p.FinalPrice,
            DisplayOrder = p.DisplayOrder
        }).ToList();
    }

    public async Task<MaintenancePackageListItemDto> CreateAsync(CreateMaintenancePackageRequest request, CancellationToken ct = default)
    {
        if (request.BasePrice < 0)
            throw new ArgumentException("BasePrice cannot be negative.");
        if (request.DiscountPercent < 0 || request.DiscountPercent > 100)
            throw new ArgumentException("DiscountPercent must be between 0 and 100.");

        var existing = await _repository.GetByPackageCodeAsync(request.PackageCode.Trim(), ct);
        if (existing != null)
            throw new ConflictException("PackageCode already exists.");

        var existingOrder = await _repository.GetByDisplayOrderAsync(request.DisplayOrder, ct);
        if (existingOrder != null)
            throw new ConflictException("DisplayOrder already exists.");

        var entity = new MaintenancePackage
        {
            PackageCode = request.PackageCode.Trim(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            KilometerMilestone = request.KilometerMilestone,
            MonthMilestone = request.MonthMilestone,
            BasePrice = request.BasePrice,
            DiscountPercent = request.DiscountPercent,
            EstimatedDurationHours = request.EstimatedDurationHours,
            ApplicableBrands = request.ApplicableBrands?.Trim(),
            Image = request.Image,
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive
        };

        var created = await _repository.AddAsync(entity, ct);
        var loaded = await _repository.GetByIdAsync(created.PackageID, ct);
        if (loaded == null)
            return new MaintenancePackageListItemDto
            {
                PackageID = created.PackageID,
                PackageCode = created.PackageCode,
                Name = created.Name,
                Description = created.Description,
                KilometerMilestone = created.KilometerMilestone,
                BasePrice = created.BasePrice,
                DiscountPercent = created.DiscountPercent,
                DisplayOrder = created.DisplayOrder
            };

        return new MaintenancePackageListItemDto
        {
            PackageID = loaded.PackageID,
            PackageCode = loaded.PackageCode,
            Name = loaded.Name,
            Description = loaded.Description,
            KilometerMilestone = loaded.KilometerMilestone,
            BasePrice = loaded.BasePrice,
            DiscountPercent = loaded.DiscountPercent,
            FinalPrice = loaded.FinalPrice,
            DisplayOrder = loaded.DisplayOrder
        };
    }
}
