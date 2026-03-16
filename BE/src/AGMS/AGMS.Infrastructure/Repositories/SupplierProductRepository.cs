using AGMS.Application.Contracts;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories
{
    public class SupplierProductRepository : ISupplierProductRepository
    {
        private readonly CarServiceDbContext _context;

        public SupplierProductRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<List<SupplierProduct>> GetProductsBySupplierIdAsync(int supplierId)
        {
            return await _context.SupplierProducts 
                .Include(sp => sp.Product)
                .Where(sp => sp.SupplierID == supplierId)
                .ToListAsync();
        }

        public async Task<SupplierProduct?> GetSpecificSupplierProductAsync(int supplierId, int productId)
        {
            return await _context.SupplierProducts 
                .FirstOrDefaultAsync(sp => sp.SupplierID == supplierId && sp.ProductID == productId);
        }

        public async Task AddAsync(SupplierProduct supplierProduct)
        {
            _context.SupplierProducts.Add(supplierProduct); 
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(SupplierProduct supplierProduct)
        {
            _context.SupplierProducts.Update(supplierProduct); 
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(SupplierProduct supplierProduct)
        {
            _context.SupplierProducts.Remove(supplierProduct); 
            await _context.SaveChangesAsync();
        }
    }
}