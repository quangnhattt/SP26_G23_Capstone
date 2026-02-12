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

    public async Task<IEnumerable<PartProductListItemDto>> GetPartProductsAsync(CancellationToken ct)
    {
        return await _productRepository.GetPartProductsAsync(ct);
    }
}
