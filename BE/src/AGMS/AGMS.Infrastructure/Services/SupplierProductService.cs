using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Supplier;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Services
{
    public class SupplierProductService : ISupplierProductService
    {
        private readonly ISupplierProductRepository _repo;
        private readonly CarServiceDbContext _context;

        public SupplierProductService(ISupplierProductRepository repo, CarServiceDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<List<SupplierProductResponseDto>> GetProductsBySupplierIdAsync(int supplierId)
        {
            if (!await _context.Suppliers.AnyAsync(s => s.SupplierID == supplierId))
                throw new Exception($"Nhà cung cấp với ID {supplierId} không tồn tại trong hệ thống.");
            var data = await _repo.GetProductsBySupplierIdAsync(supplierId);
            return data.Select(sp => new SupplierProductResponseDto
            {
                ProductID = sp.ProductID,
                ProductCode = sp.Product.Code,
                ProductName = sp.Product.Name,
                DeliveryDuration = sp.DeliveryDuration,
                EstimatedPrice = sp.EstimatedPrice,
                Policies = sp.Policies,
                IsActive = sp.IsActive
            }).ToList();
        }

        // 1. HÀM THÊM MỚI (POST)
        public async Task<bool> AddSupplierProductAsync(int supplierId, SupplierProductUpsertDto request)
        {
            if (!await _context.Suppliers.AnyAsync(s => s.SupplierID == supplierId))
                throw new Exception("Nhà cung cấp không tồn tại.");

            var product = await _context.Products.FindAsync(request.ProductID);
            if (product == null)
                throw new Exception("Sản phẩm không tồn tại.");

            if (product.Type != "PART")
                throw new Exception($"Không thể liên kết Nhà cung cấp với loại dịch vụ ({product.Type}). Chỉ chấp nhận Phụ tùng (PART).");

            // Nếu đã có rồi thì CHẶN ngay, không cho tạo thêm
            var existingRecord = await _repo.GetSpecificSupplierProductAsync(supplierId, request.ProductID);
            if (existingRecord != null)
                throw new Exception("Sản phẩm này ĐÃ ĐƯỢC LIÊN KẾT với nhà cung cấp. Vui lòng sử dụng chức năng Cập nhật (Edit).");

            var newRecord = new SupplierProduct
            {
                SupplierID = supplierId,
                ProductID = request.ProductID,
                DeliveryDuration = request.DeliveryDuration,
                EstimatedPrice = request.EstimatedPrice,
                Policies = request.Policies,
                IsActive = request.IsActive
            };

            await _repo.AddAsync(newRecord);
            return true;
        }

        // 2. HÀM CẬP NHẬT (PUT)
        public async Task<bool> UpdateSupplierProductAsync(int supplierId, int productId, SupplierProductUpsertDto request)
        {
            // Bắt buộc phải tồn tại thì mới cho sửa
            var existingRecord = await _repo.GetSpecificSupplierProductAsync(supplierId, productId);
            if (existingRecord == null)
                throw new Exception("Không tìm thấy liên kết giữa Sản phẩm và Nhà cung cấp này. Cập nhật thất bại.");

            // Cập nhật các trường thông tin
            existingRecord.DeliveryDuration = request.DeliveryDuration;
            existingRecord.EstimatedPrice = request.EstimatedPrice;
            existingRecord.Policies = request.Policies;
            existingRecord.IsActive = request.IsActive;

            await _repo.UpdateAsync(existingRecord);
            return true;
        }
        public async Task<bool> CreateNewProductAndLinkToSupplierAsync(int supplierId, SupplierNewProductRequestDto request)
        {
            if (!await _context.Suppliers.AnyAsync(s => s.SupplierID == supplierId))
                throw new Exception("Nhà cung cấp không tồn tại.");

            if (await _context.Products.AnyAsync(p => p.Code == request.ProductCode))
                throw new Exception($"Mã sản phẩm '{request.ProductCode}' đã tồn tại trong hệ thống. Vui lòng sử dụng chức năng thêm sản phẩm có sẵn.");

            // Sử dụng Transaction: Đảm bảo nếu lưu SupplierProduct lỗi thì Product cũng bị rollback (hủy), không sinh ra rác
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Tạo mới dữ liệu Master Product
                var newProduct = new Product
                {
                    Code = request.ProductCode,
                    Name = request.ProductName,
                    Type = "PART", // Mặc định phải là PART
                    Price = request.Price,
                    Description = request.Description,
                    WarrantyPeriodMonths = request.WarrantyPeriodMonths,
                    MinStockLevel = request.MinStockLevel,
                    CategoryID = request.CategoryID,
                    UnitID = request.UnitID,
                    IsActive = true,
                    CreatedDate = DateTime.Now
                };

                _context.Products.Add(newProduct);
                await _context.SaveChangesAsync(); // Lưu để sinh ra ProductID tự tăng

                // 2. Tạo liên kết với Nhà cung cấp sử dụng ProductID vừa sinh ra
                var newSupplierProduct = new SupplierProduct
                {
                    SupplierID = supplierId,
                    ProductID = newProduct.ProductID, // Magic ở đây!
                    DeliveryDuration = request.DeliveryDuration,
                    EstimatedPrice = request.EstimatedPrice,
                    Policies = request.Policies,
                    IsActive = true
                };

                _context.SupplierProducts.Add(newSupplierProduct);

                // 3. Khởi tạo luôn Tồn kho bằng 0 cho sản phẩm mới này (Tránh lỗi màn hình Dashboard Kho)
                var newInventory = new ProductInventory
                {
                    ProductID = newProduct.ProductID,
                    Quantity = 0,
                    LastUpdated = DateTime.Now
                };
                _context.ProductInventories.Add(newInventory);

                await _context.SaveChangesAsync();

                // Commit xác nhận hoàn thành
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw new Exception("Có lỗi xảy ra trong quá trình khởi tạo sản phẩm mới. Giao dịch đã được hoàn tác.");
            }
        }

        public async Task<bool> RemoveProductFromSupplierAsync(int supplierId, int productId)
        {
            var record = await _repo.GetSpecificSupplierProductAsync(supplierId, productId);
            if (record == null)
                throw new Exception("Sản phẩm này chưa được liên kết với nhà cung cấp.");

            await _repo.DeleteAsync(record);
            return true;
        }
    }
}