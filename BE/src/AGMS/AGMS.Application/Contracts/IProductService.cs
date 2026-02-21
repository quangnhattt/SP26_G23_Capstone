using AGMS.Application.DTOs.Product;

namespace AGMS.Application.Contracts;

public interface IProductService
{
    Task<IEnumerable<PartProductListItemDto>> GetPartProductsAsync(CancellationToken ct);
    Task<PartProductListItemDto> AddPartProductAsync(CreatePartProductDto request, CancellationToken ct);
    Task<PartProductListItemDto> UpdatePartProductAsync(int id,UpdatePartProductDto request, CancellationToken ct);    
    Task<bool> DeactivePartProductAsync(int id, CancellationToken ct);
    Task<bool> ActivePartProductAsync(int id, CancellationToken ct);
    //Product Service
    Task<IEnumerable<ServiceProductListItemDto>> GetServiceProductsAsync(CancellationToken ct);
    Task<ServiceProductListItemDto> AddServiceProductAsync(CreateServiceProductDto request, CancellationToken ct);
    Task<ServiceProductListItemDto?> UpdateServiceProductAsync(int id, UpdateServiceProductDto request, CancellationToken ct);
}
