using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Product;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly CarServiceDbContext _db;

    public ProductRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<PartProductListItemDto>> GetPartProductsAsync(CancellationToken ct)
    {
        return await _db.Products
            .AsNoTracking()
            .Where(p => p.Type == "PART")
            .Select(p => new PartProductListItemDto
            {
                Id = p.ProductID,
                Code = p.Code,
                Name = p.Name,
                Price = p.Price,
                Unit = p.Unit != null ? p.Unit.Name : null,
                Category = p.Category != null ? p.Category.Name : null,
                Warranty = p.WarrantyPeriodMonths,
                MinStockLevel = p.MinStockLevel,
                StockQty = p.ProductItems.Count(pi => pi.Status == "IN_STOCK"),
                Description = p.Description,
                Image = p.Image,
                IsActive = p.IsActive
            })
            .ToListAsync(ct);
    }
    public async Task<PartProductListItemDto> AddPartProductAsync(CreatePartProductDto request, CancellationToken ct)
    {
        var product = new Product
        {
            Code = request.Code,
            Name = request.Name,
            Type = "PART",
            Price = request.Price,
            Description = request.Description,
            Image = request.Image,
            UnitID = request.UnitId,
            CategoryID = request.CategoryId,
            WarrantyPeriodMonths = request.Warranty,
            MinStockLevel = request.MinStockLevel,
            IsActive = request.IsActive
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);

        // Load navigation properties to populate DTO
        await _db.Entry(product).Reference(p => p.Unit).LoadAsync(ct);
        await _db.Entry(product).Reference(p => p.Category).LoadAsync(ct);

        var stockQty = await _db.ProductItems
            .AsNoTracking()
            .CountAsync(pi => pi.ProductID == product.ProductID && pi.Status == "IN_STOCK", ct);

        return new PartProductListItemDto
        {
            Id = product.ProductID,
            Code = product.Code,
            Name = product.Name,
            Price = product.Price,
            Unit = product.Unit != null ? product.Unit.Name : null,
            Category = product.Category != null ? product.Category.Name : null,
            Warranty = product.WarrantyPeriodMonths,
            MinStockLevel = product.MinStockLevel,
            StockQty = stockQty,
            Description = product.Description,
            Image = product.Image,
            IsActive = product.IsActive
        };
    }
    public async Task<PartProductListItemDto> UpdatePartProductAsync(int id, UpdatePartProductDto request, CancellationToken ct)
    {
        var product = await _db.Products
            .Include(p => p.Unit)
            .Include(p => p.Category)
            .Include(p => p.ProductItems)
            .FirstOrDefaultAsync(p => p.Type == "PART" && p.ProductID == id, ct);

        if (product == null)
        {
            return null;
        }
        product.Name = request.Name;
        product.Price = request.Price;
        product.UnitID = request.UnitId;
        product.CategoryID = request.CategoryId;
        product.WarrantyPeriodMonths = request.Warranty;
        product.MinStockLevel = request.MinStockLevel;
        product.Description = request.Description;
        product.Image = request.Image;
        product.IsActive = request.IsActive;
        await _db.SaveChangesAsync(ct);
        var stockQty = product.ProductItems.Count(pi => pi.Status == "IN_STOCK");
        return new PartProductListItemDto
        {
            Id = product.ProductID,
            Code = product.Code,
            Name = product.Name,
            Price = product.Price,
            Unit = product.Unit != null ? product.Unit.Name : null,
            Category = product.Category != null ? product.Category.Name : null,
            Warranty = product.WarrantyPeriodMonths,
            MinStockLevel = product.MinStockLevel,
            StockQty = stockQty,
            Description = product.Description,
            Image = product.Image,
            IsActive = product.IsActive,
        };
    }


}
