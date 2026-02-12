using AGMS.Application.DTOs.Product;

namespace AGMS.Application.Contracts;

public interface IProductRepository
{
    Task<IEnumerable<PartProductListItemDto>> GetPartProductsAsync(CancellationToken ct);
}
