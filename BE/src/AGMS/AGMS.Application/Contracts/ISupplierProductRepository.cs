using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts
{
    public interface ISupplierProductRepository
    {
        Task<List<SupplierProduct>> GetProductsBySupplierIdAsync(int supplierId);
        Task<SupplierProduct?> GetSpecificSupplierProductAsync(int supplierId, int productId);
        Task AddAsync(SupplierProduct supplierProduct);
        Task UpdateAsync(SupplierProduct supplierProduct);
        Task DeleteAsync(SupplierProduct supplierProduct);
    }
}