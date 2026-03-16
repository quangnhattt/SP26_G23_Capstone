using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Inventory;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly CarServiceDbContext _context;

        public InventoryRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<List<InventoryDashboardDto>> GetInventoryDashboardAsync()
        {
            // Lọc ra các sản phẩm là Phụ tùng (PART) và đang hoạt động
            var query = _context.Products
                .Where(p => p.Type == "PART" && p.IsActive)
                .Select(p => new InventoryDashboardDto
                {
                    ProductID = p.ProductID,
                    ProductCode = p.Code,
                    ProductName = p.Name,
                    CategoryName = p.Category != null ? p.Category.Name : "Chưa phân loại",

                    // Lấy dữ liệu từ bảng ProductInventory (nếu chưa có thì mặc định là 0)
                    Quantity = p.ProductInventory != null ? p.ProductInventory.Quantity : 0,
                    ReservedQuantity = p.ProductInventory != null ? p.ProductInventory.ReservedQuantity : 0,

                    // Tính số lượng khả dụng: Tổng - Giữ chỗ
                    AvailableQuantity = p.ProductInventory != null
                        ? (p.ProductInventory.Quantity - p.ProductInventory.ReservedQuantity)
                        : 0,

                    MinStockLevel = p.MinStockLevel,

                    // Xác định trạng thái cảnh báo: Khả dụng <= Tồn tối thiểu
                    IsLowStock = p.ProductInventory != null
                        ? ((p.ProductInventory.Quantity - p.ProductInventory.ReservedQuantity) <= p.MinStockLevel)
                        : true // Nếu chưa có kho thì chắc chắn là thiếu hàng
                });

            return await query.ToListAsync();
        }
    }
}