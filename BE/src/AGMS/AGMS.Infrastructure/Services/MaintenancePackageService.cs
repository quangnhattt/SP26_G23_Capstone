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

    // GetPackagesWithActiveProductDetailsAsync (trả về list tất cả gói + products) đã được thay thế
    // bằng API detail theo packageId: GetByIdWithActiveProductsAsync.
    public async Task<IEnumerable<MaintenancePackageListItemDto>> GetAllPackagesAsync(CancellationToken ct = default)
    {
        var list = await _repository.GetAllOrderedByDisplayOrderAsync(ct);
        return list.Select(p => new MaintenancePackageListItemDto
        {
            PackageID = p.PackageID,
            PackageCode = p.PackageCode,
            Name = p.Name,
            BasePrice = p.BasePrice,
            DiscountPercent = p.DiscountPercent,
            FinalPrice = p.FinalPrice,
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
                BasePrice = created.BasePrice,
                DiscountPercent = created.DiscountPercent,
                IsActive = created.IsActive
            };

        return new MaintenancePackageListItemDto
        {
            PackageID = loaded.PackageID,
            PackageCode = loaded.PackageCode,
            Name = loaded.Name,
            BasePrice = loaded.BasePrice,
            DiscountPercent = loaded.DiscountPercent,
            FinalPrice = loaded.FinalPrice,
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
            BasePrice = loaded.BasePrice,
            DiscountPercent = loaded.DiscountPercent,
            FinalPrice = loaded.FinalPrice,
            IsActive = loaded.IsActive
        };
    }

    public async Task<MaintenancePackageDetailDto> GetByIdWithActiveProductsAsync(int packageId, CancellationToken ct = default)
    {
        var package = await _repository.GetByIdAsync(packageId, ct)
            ?? throw new KeyNotFoundException($"Maintenance package with ID {packageId} not found.");

        // lấy tất cả detail đang active rồi filter theo packageId
        var allDetails = await _repository.GetPackagesWithActiveProductDetailsAsync(ct);
        var details = allDetails
            .Where(d => d.PackageID == packageId)
            .OrderBy(d => d.DisplayOrder)
            .ToList();

        return new MaintenancePackageDetailDto
        {
            PackageID = package.PackageID,
            PackageCode = package.PackageCode,
            Name = package.Name,
            Description = package.Description,
            KilometerMilestone = package.KilometerMilestone,
            MonthMilestone = package.MonthMilestone,
            BasePrice = package.BasePrice,
            DiscountPercent = package.DiscountPercent,
            FinalPrice = package.FinalPrice,
            EstimatedDurationHours = package.EstimatedDurationHours,
            ApplicableBrands = package.ApplicableBrands,
            Image = package.Image,
            DisplayOrder = package.DisplayOrder,
            IsActive = package.IsActive,
            CreatedDate = package.CreatedDate,
            CreatedBy = package.CreatedBy,
            Products = details.Select(d => new PackageProductItemDto
            {
                ProductID = d.ProductID,
                ProductName = d.Product.Name,
                Quantity = d.Quantity,
                ProductStatus = d.Product.IsActive,
                DisplayOrder = d.DisplayOrder
            }).ToList()
        };
    }
}
