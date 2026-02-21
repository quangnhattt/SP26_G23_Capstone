using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Product;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using System.Net.WebSockets;
using System.Reflection.Metadata.Ecma335;

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
        // Always auto-generate Code
        var now = DateTime.UtcNow;
        var random = new Random().Next(100, 999); // Random 3 digits
        var code = $"P{now:ddHHmm}{random:D3}";
        // Validate CategoryID if provided: must be a category of type Part
        if (request.CategoryId.HasValue)
        {
            var category = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CategoryID == request.CategoryId.Value, ct);
            if (category == null)
            {
                throw new ArgumentException("Category does not exist.");
            }
            if (category.Type != "Part" && category.Type != "PART")
            {
                throw new ArgumentException("Category must be of type Part.");
            }
        }

        // Validate UnitID if provided: must be a unit of type Part
        if (request.UnitId.HasValue)
        {
            var unit = await _db.Units
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UnitID == request.UnitId.Value, ct);
            if (unit == null)
            {
                throw new ArgumentException("Unit does not exist.");
            }
            if (unit.Type != "Part" && unit.Type != "PART")
            {
                throw new ArgumentException("Unit must be of type Part.");
            }
        }

        var product = new Product
        {
            Code = code,
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
        // Validate CategoryID if provided: must be a category of type Part
        if (request.CategoryId.HasValue)
        {
            var category = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CategoryID == request.CategoryId.Value, ct);
            if (category == null)
            {
                throw new ArgumentException("Category does not exist.");
            }
            if (category.Type != "Part" && category.Type != "PART")
            {
                throw new ArgumentException("Category must be of type Part.");
            }
        }
        // Validate UnitID if provided: must be a unit of type Part
        if (request.UnitId.HasValue)
        {
            var unit = await _db.Units
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UnitID == request.UnitId.Value, ct);
            if (unit == null)
            {
                throw new ArgumentException("Unit does not exist.");
            }
            if (unit.Type != "Part" && unit.Type != "PART")
            {
                throw new ArgumentException("Unit must be of type Part.");
            }
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
    public async Task<bool> DeactivePartProductAsync(int id, CancellationToken ct)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Type == "PART" && p.ProductID == id, ct);
        if (product == null) return false;
        if (!product.IsActive)
        {
            return true;
        }

        product.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }
    public async Task<bool> ActivePartProductAsync(int id, CancellationToken ct)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Type == "PART" && p.ProductID == id, ct);
        if (product == null) return false;
        if (product.IsActive)
        {
            return true;
        }
        product.IsActive = true;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // Product Service 
    public async Task<IEnumerable<ServiceProductListItemDto>> GetServiceProductsAsync(CancellationToken ct)
    {
        return await _db.Products
            .AsNoTracking()
            .Where(p => p.Type == "SERVICE" || p.Type == "Service")
            .Select(p => new ServiceProductListItemDto
            {
                Id = p.ProductID,
                Code = p.Code,
                Name = p.Name,
                Price = p.Price,
                Unit = p.Unit != null ? p.Unit.Name : null,
                Category = p.Category != null ? p.Category.Name : null,
                EstimatedDurationHours = p.EstimatedDurationHours,
                Description = p.Description,
                Image = p.Image,
                IsActive = p.IsActive
            })
            .ToListAsync(ct);
    }
    public async Task<ServiceProductListItemDto> AddServiceProductAsync(CreateServiceProductDto request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var random = new Random().Next(100, 999);
        var code = string.IsNullOrWhiteSpace(request.Code) ? $"S{now:ddHHmm}{random:D3}" : request.Code.Trim();
        if (request.CategoryId.HasValue)
        {
            var category = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CategoryID == request.CategoryId.Value, ct);
            if (category == null)
            {
                throw new ArgumentException("Category does not exist");
            }
            if (category.Type != "Service" && category.Type != " SERVICE")
            {
                throw new ArgumentException("Category must be of type Serivce or SERIVCE");
            }
        }

        if (request.UnitId.HasValue)
        {
            var unit = await _db.Units
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UnitID == request.UnitId.Value, ct);
            if (unit == null)
            {
                throw new ArgumentException("Unit does not exist");
            }
            if (unit.Type != "Serivce" && unit.Type != "SERVICE")
            {
                throw new ArgumentException("Unit must be of type SERVICE or Service");
            }
        }
        var product = new Product
        {
            Code = code,
            Name = request.Name,
            Type = "SERVICE",
            Price = request.Price,
            Description = request.Description,
            Image = request.Image,
            UnitID = request.UnitId,
            CategoryID = request.CategoryId,
            EstimatedDurationHours = request.EstimatedDurationHours,
            WarrantyPeriodMonths = 0,
            MinStockLevel = 0,
            IsActive = request.IsActive
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(product).Reference(p => p.Unit).LoadAsync(ct);
        await _db.Entry(product).Reference(p => p.Category).LoadAsync(ct);
        return new ServiceProductListItemDto
        {
            Id = product.ProductID,
            Code = product.Code,
            Name = product.Name,
            Price = product.Price,
            Unit = product.Unit != null ? product.Unit.Name : null,
            Category = product.Category != null ? product.Category.Name : null,
            EstimatedDurationHours = product.EstimatedDurationHours,
            Description = product.Description,
            Image = product.Image,
            IsActive = product.IsActive
        };


    }
    public async Task<ServiceProductListItemDto?> UpdateServiceProductAsync(int id, UpdateServiceProductDto request, CancellationToken ct)
    {
        var product = await _db.Products
            .Include(p => p.Unit)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => (p.Type == "SERVICE" || p.Type == "Service") && p.ProductID == id, ct);
        if (product == null)
        {
            return null;
        }
        if (request.CategoryId.HasValue)
        {
            var category = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CategoryID == request.CategoryId.Value, ct);
            if (category == null)
                throw new ArgumentException("Category does not exist");
            if (category.Type != "Service" && category.Type != "SERVICE")
                throw new ArgumentException("Category musst be of type Serivce");
        }
        if (request.UnitId.HasValue)
        {
            var unit = await _db.Units
                .AsNoTracking().FirstOrDefaultAsync(u => u.UnitID == request.UnitId.Value, ct);
            if (unit == null)
            {
                throw new ArgumentException("Unit does not exist");
            }
            if (unit.Type != "SERVICE" && unit.Type != "Service")
            {
                throw new ArgumentException("Unit must be of type Service");
            }
        } 
            if (!string.IsNullOrWhiteSpace(request.Code))
                product.Code = request.Code;
            product.Name = request.Name;
            product.Price = request.Price;
            product.UnitID = request.UnitId;
            product.CategoryID = request.CategoryId;
            product.EstimatedDurationHours = request.EstimatedDurationHours;
            product.Description = request.Description;
            product.Image = request.Image;
            product.IsActive= request.IsActive;
            await _db.SaveChangesAsync(ct);

            await _db.Entry(product).Reference(p=>p.Unit).LoadAsync(ct);
            await _db.Entry(product).Reference(p => p.Category).LoadAsync(ct);
            return new ServiceProductListItemDto
            {
                Id=product.ProductID,
                Code=product.Code,
                Name=product.Name,
                Price=product.Price,
                Unit=product.Unit !=null ? product.Unit.Name : null,
                Category=product.Category !=null ? product.Category.Name : null,
                EstimatedDurationHours=product.EstimatedDurationHours,
                Description=product.Description,
                Image=product.Image,    
                IsActive=product.IsActive,

            };
        }
    }
