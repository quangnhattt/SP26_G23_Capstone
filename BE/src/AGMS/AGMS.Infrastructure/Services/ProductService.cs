using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Product;

namespace AGMS.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<PagedResultDto<PartProductListItemDto>> GetPartProductsAsync(PartProductQueryDto query, CancellationToken ct)
    {
        return await _productRepository.GetPartProductsAsync(query,ct);
    }
    public async Task<PartProductListItemDto> AddPartProductAsync(CreatePartProductDto request, CancellationToken ct)
    {
        return await _productRepository.AddPartProductAsync(request, ct);
    }
    public async Task<PartProductListItemDto> UpdatePartProductAsync(int id,UpdatePartProductDto request, CancellationToken ct)
    {
        return await _productRepository.UpdatePartProductAsync(id, request, ct);

    }
    public async Task<bool> ChangeProductStatusAsync(int id, bool isActive, CancellationToken ct)
    {
        return await _productRepository.ChangeProductStatusAsync(id, isActive, ct);
    }
    public async Task<PagedResultDto<ServiceProductListItemDto>> GetServiceProductsAsync(ServiceProductQueryDto query, CancellationToken ct)
    {
        return await _productRepository.GetServiceProductsAsync(query, ct);
    }
    public async Task<ServiceProductListItemDto> AddServiceProductAsync(CreateServiceProductDto request, CancellationToken ct)
    {
        return await _productRepository.AddServiceProductAsync(request, ct);
    }
    public async Task<ServiceProductListItemDto?> UpdateServiceProductAsync(int id, UpdateServiceProductDto request, CancellationToken ct)
    {
        return await _productRepository.UpdateServiceProductAsync(id, request, ct);
    }

}
