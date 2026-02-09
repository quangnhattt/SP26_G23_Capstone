using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(int id, CancellationToken ct);
    Task<IEnumerable<Category>> GetAllAsync(CancellationToken ct);
    Task<IEnumerable<Category>> GetByTypeAsync(string type, CancellationToken ct);
    Task<Category?> GetByNameAsync(string name, CancellationToken ct);
    Task AddAsync(Category category, CancellationToken ct);
    Task UpdateAsync(Category category, CancellationToken ct);
    Task DeleteAsync(int id, CancellationToken ct);
    Task<bool> ExistsAsync(int id, CancellationToken ct);
}
