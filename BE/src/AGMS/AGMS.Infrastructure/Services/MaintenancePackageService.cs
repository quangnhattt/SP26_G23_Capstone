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
        // 1) Lấy tất cả gói (kể cả gói chưa có ProductID nào)
        var packages = await _repository.GetAllOrderedByDisplayOrderAsync(ct);

        // 2) Lấy chi tiết cho các sản phẩm đang active
        var details = await _repository.GetPackagesWithActiveProductDetailsAsync(ct);

        // 3) GroupJoin: mỗi package đi kèm 1 tập detail (có thể rỗng)
        var result = packages
            .GroupJoin(
                details,
                p => p.PackageID,          // key của package
                d => d.PackageID,          // key của detail
                (p, dGroup) => new PackageWithProductsDto
                {
                    PackageCode = p.PackageCode,
                    PackageName = p.Name,
                    PackageTotalPrice = p.FinalPrice,
                    Products = dGroup
                        .OrderBy(d => d.DisplayOrder)
                        .Select(d => new PackageProductItemDto
                        {
                            ProductID = d.ProductID,
                            ProductName = d.Product.Name,
                            Quantity = d.Quantity,
                            ProductStatus = d.Product.IsActive,
                            DisplayOrder = d.DisplayOrder
                        })
                        .ToList()
                });

        return result.ToList();
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
            DisplayOrder = p.DisplayOrder,
            IsActive = p.IsActive
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
                DisplayOrder = created.DisplayOrder,
                IsActive = created.IsActive
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
            DisplayOrder = loaded.DisplayOrder,
            IsActive = loaded.IsActive
        };
    }

    public async Task<MaintenancePackageListItemDto> UpdateAsync(int packageId, UpdateMaintenancePackageRequest request, CancellationToken ct = default)
    {
        if (request.BasePrice < 0)
            throw new ArgumentException("BasePrice cannot be negative.");
        if (request.DiscountPercent < 0 || request.DiscountPercent > 100)
            throw new ArgumentException("DiscountPercent must be between 0 and 100.");

        var existing = await _repository.GetByIdAsync(packageId, ct)
            ?? throw new KeyNotFoundException($"Maintenance package with ID {packageId} not found.");

        var existingOrder = await _repository.GetByDisplayOrderAsync(request.DisplayOrder, ct);
        if (existingOrder != null && existingOrder.PackageID != packageId)
            throw new ConflictException("DisplayOrder already exists.");

        existing.Name = request.Name.Trim();
        existing.Description = request.Description?.Trim();
        existing.KilometerMilestone = request.KilometerMilestone;
        existing.MonthMilestone = request.MonthMilestone;
        existing.BasePrice = request.BasePrice;
        existing.DiscountPercent = request.DiscountPercent;
        existing.EstimatedDurationHours = request.EstimatedDurationHours;
        existing.ApplicableBrands = request.ApplicableBrands?.Trim();
        existing.Image = request.Image;
        existing.DisplayOrder = request.DisplayOrder;
        existing.IsActive = request.IsActive;

        await _repository.UpdateAsync(existing, ct);

        var loaded = await _repository.GetByIdAsync(packageId, ct) ?? existing;

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
            DisplayOrder = loaded.DisplayOrder,
            IsActive = loaded.IsActive
        };
    }
}
