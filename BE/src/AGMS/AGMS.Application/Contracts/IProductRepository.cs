using AGMS.Application.DTOs.Product;

namespace AGMS.Application.Contracts;

public interface IProductRepository
{
    //Product Part
    Task<IEnumerable<PartProductListItemDto>> GetPartProductsAsync(CancellationToken ct);
    Task<PartProductListItemDto> AddPartProductAsync(CreatePartProductDto request, CancellationToken ct);
    Task <PartProductListItemDto> UpdatePartProductAsync(int id, UpdatePartProductDto request,CancellationToken ct);
    Task<bool> ChangePartProductStatusAsync(int id, bool isActive, CancellationToken ct);
    //Product Service 
    Task<IEnumerable<ServiceProductListItemDto>> GetServiceProductsAsync(CancellationToken ct);
    Task<ServiceProductListItemDto> AddServiceProductAsync(CreateServiceProductDto request, CancellationToken ct);
    Task<ServiceProductListItemDto?> UpdateServiceProductAsync(int id, UpdateServiceProductDto request, CancellationToken ct);
    Task<bool> ChangeServiceProductStatusAsync(int id, bool isActive, CancellationToken ct);

}
