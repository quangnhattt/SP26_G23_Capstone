using AGMS.Application.DTOs.Product;

namespace AGMS.Application.Contracts;

public interface IProductService
{
    Task<IEnumerable<PartProductListItemDto>> GetPartProductsAsync(CancellationToken ct);
}
