using AGMS.Application.Contracts;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly CarServiceDbContext _db;

    public CategoryRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<Category?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _db.Categories
            .FirstOrDefaultAsync(c => c.CategoryID == id, ct);
    }

    public async Task<(IEnumerable<Category> Categories, int TotalCount)> GetAllAsync(string? name, string? type, int? page, int? pageSize, CancellationToken ct)
    {
        var query = _db.Categories.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            query = query.Where(c => c.Name.Contains(name));
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(c => c.Type == type);
        }

        int totalCount = await query.CountAsync(ct);

        if (page.HasValue && pageSize.HasValue && page.Value > 0 && pageSize.Value > 0)
        {
            query = query.Skip((page.Value - 1) * pageSize.Value).Take(pageSize.Value);
        }

        var categories = await query
            .OrderBy(c => c.CategoryID)
            .ToListAsync(ct);

        return (categories, totalCount);
    }

    public async Task<IEnumerable<Category>> GetByTypeAsync(string type, CancellationToken ct)
    {
        return await _db.Categories
            .AsNoTracking()
            .Where(c => c.Type == type)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);
    }

    public async Task<Category?> GetByNameAsync(string name, CancellationToken ct)
    {
        return await _db.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Name == name, ct);
    }

    public async Task AddAsync(Category category, CancellationToken ct)
    {
        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Category category, CancellationToken ct)
    {
        _db.Categories.Update(category);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var category = await _db.Categories.FindAsync(new object[] { id }, ct);
        if (category != null)
        {
            _db.Categories.Remove(category);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken ct)
    {
        return await _db.Categories
            .AnyAsync(c => c.CategoryID == id, ct);
    }
}
