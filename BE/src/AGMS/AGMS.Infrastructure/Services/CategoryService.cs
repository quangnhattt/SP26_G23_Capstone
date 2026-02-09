using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Category;
using AGMS.Domain.Entities;

namespace AGMS.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken ct)
    {
        // Validate Type
        if (request.Type != "Service" && request.Type != "Part")
        {
            throw new ArgumentException("Type must be either 'Service' or 'Part'.");
        }

        // Check if category with same name already exists
        var existingCategory = await _categoryRepository.GetByNameAsync(request.Name.Trim(), ct);
        if (existingCategory != null)
        {
            throw new InvalidOperationException($"Category with name '{request.Name}' already exists.");
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Type = request.Type,
            Description = request.Description?.Trim()
        };

        await _categoryRepository.AddAsync(category, ct);

        return new CategoryResponse
        {
            CategoryID = category.CategoryID,
            Name = category.Name,
            Type = category.Type,
            Description = category.Description
        };
    }

    public async Task<CategoryResponse?> GetByIdAsync(int id, CancellationToken ct)
    {
        var category = await _categoryRepository.GetByIdAsync(id, ct);
        if (category == null)
            return null;

        return new CategoryResponse
        {
            CategoryID = category.CategoryID,
            Name = category.Name,
            Type = category.Type,
            Description = category.Description
        };
    }

    public async Task<IEnumerable<CategoryResponse>> GetAllAsync1(CancellationToken ct)
    {
        var categories = await _categoryRepository.GetAllAsync(ct);
        return categories.Select(c => new CategoryResponse
        {
            CategoryID = c.CategoryID,
            Name = c.Name,
            Type = c.Type,
            Description = c.Description
        });
    }

    public async Task<IEnumerable<CategoryResponse>> GetByTypeAsync(string type, CancellationToken ct)
    {
        // Validate Type
        if (type != "Service" && type != "Part")
        {
            throw new ArgumentException("Type must be either 'Service' or 'Part'.");
        }

        var categories = await _categoryRepository.GetByTypeAsync(type, ct);
        return categories.Select(c => new CategoryResponse
        {
            CategoryID = c.CategoryID,
            Name = c.Name,
            Type = c.Type,
            Description = c.Description
        });
    }

    public async Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken ct)
    {
        // Validate Type
        if (request.Type != "Service" && request.Type != "Part")
        {
            throw new ArgumentException("Type must be either 'Service' or 'Part'.");
        }

        var category = await _categoryRepository.GetByIdAsync(id, ct);
        if (category == null)
        {
            throw new KeyNotFoundException($"Category with ID {id} not found.");
        }

        // Check if another category with same name exists
        var existingCategory = await _categoryRepository.GetByNameAsync(request.Name.Trim(), ct);
        if (existingCategory != null && existingCategory.CategoryID != id)
        {
            throw new InvalidOperationException($"Category with name '{request.Name}' already exists.");
        }

        // Update properties
        category.Name = request.Name.Trim();
        category.Type = request.Type;
        category.Description = request.Description?.Trim();

        await _categoryRepository.UpdateAsync(category, ct);

        return new CategoryResponse
        {
            CategoryID = category.CategoryID,
            Name = category.Name,
            Type = category.Type,
            Description = category.Description
        };
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var exists = await _categoryRepository.ExistsAsync(id, ct);
        if (!exists)
        {
            throw new KeyNotFoundException($"Category with ID {id} not found.");
        }

        await _categoryRepository.DeleteAsync(id, ct);
    }
}
