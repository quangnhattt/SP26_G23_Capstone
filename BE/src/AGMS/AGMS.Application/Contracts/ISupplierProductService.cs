using AGMS.Application.DTOs.Supplier;

namespace AGMS.Application.Contracts
{
    public interface ISupplierProductService
    {
        Task<List<SupplierProductResponseDto>> GetProductsBySupplierIdAsync(int supplierId);
        Task<bool> AddSupplierProductAsync(int supplierId, SupplierProductUpsertDto request);
        Task<bool> UpdateSupplierProductAsync(int supplierId, int productId, SupplierProductUpsertDto request);
        Task<bool> RemoveProductFromSupplierAsync(int supplierId, int productId);
        Task<bool> CreateNewProductAndLinkToSupplierAsync(int supplierId, SupplierNewProductRequestDto request);
    }
}