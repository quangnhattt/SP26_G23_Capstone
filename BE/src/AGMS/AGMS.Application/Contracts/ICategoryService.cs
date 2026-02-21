using AGMS.Application.DTOs.Category;

namespace AGMS.Application.Contracts;

public interface ICategoryService
{
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken ct);
    Task<CategoryResponse?> GetByIdAsync(int id, CancellationToken ct);
    Task<IEnumerable<CategoryResponse>> GetAllAsync(CancellationToken ct);
    Task<IEnumerable<CategoryResponse>> GetByTypeAsync(string type, CancellationToken ct);
    Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken ct);
    Task DeleteAsync(int id, CancellationToken ct);
}
