using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Product;
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
}
