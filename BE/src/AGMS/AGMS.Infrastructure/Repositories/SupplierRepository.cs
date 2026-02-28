using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Supplier;
using AGMS.Application.DTOs.Unit;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db; 
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories
{
    public class SupplierRepository : ISupplierRepository
    {
        private readonly CarServiceDbContext _context; // Đổi tên DbContext cho đúng với project của bạn

        public SupplierRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<SupplierDto>> GetSuppliersAsync(SupplierFilterDto filter)
        {
            var query = _context.Suppliers.AsQueryable();

            // 1. Lọc theo trạng thái
            if (filter.IsActive.HasValue)
            {
                query = query.Where(s => s.IsActive == filter.IsActive.Value);
            }

            // 2. Tìm kiếm (Theo Tên, Phone, Email)
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = $"%{filter.SearchTerm.Trim()}%";
                query = query.Where(s =>
                    EF.Functions.Like(s.Name, searchTerm) ||
                    (s.Phone != null && EF.Functions.Like(s.Phone, searchTerm)) ||
                    (s.Email != null && EF.Functions.Like(s.Email, searchTerm))
                );
            }

            var totalCount = await query.CountAsync();

            // 3. Phân trang
            var items = await query
                .OrderByDescending(s => s.CreatedDate) // Mới tạo đưa lên đầu
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(s => new SupplierDto
                {
                    SupplierID = s.SupplierID,
                    Name = s.Name,
                    Address = s.Address,
                    Phone = s.Phone,
                    Email = s.Email,
                    Description = s.Description,
                    IsActive = s.IsActive,
                    CreatedDate = s.CreatedDate
                })
                .ToListAsync();

            return new PagedResult<SupplierDto>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        public async Task<Supplier?> GetByIdAsync(int id)
        {
            return await _context.Suppliers.FindAsync(id);
        }

        public async Task<bool> IsNameExistsAsync(string name, int? excludeId = null)
        {
            var normalizedName = name.Trim().ToLower();
            var query = _context.Suppliers.Where(s => s.Name.ToLower() == normalizedName);

            if (excludeId.HasValue)
                query = query.Where(s => s.SupplierID != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<bool> IsPhoneOrEmailExistsAsync(string? phone, string? email, int? excludeId = null)
        {
            var query = _context.Suppliers.AsQueryable();
            if (excludeId.HasValue)
                query = query.Where(s => s.SupplierID != excludeId.Value);

            bool phoneExists = !string.IsNullOrWhiteSpace(phone) && await query.AnyAsync(s => s.Phone == phone.Trim());
            bool emailExists = !string.IsNullOrWhiteSpace(email) && await query.AnyAsync(s => s.Email == email.Trim());

            return phoneExists || emailExists;
        }

        public async Task<bool> HasPendingOrdersAsync(int supplierId)
        {
            return await _context.TransferOrders
                .AnyAsync(t => t.SupplierID == supplierId && t.Status != "Completed");
        }

        public async Task<Supplier> AddAsync(Supplier supplier)
        {
            await _context.Suppliers.AddAsync(supplier);
            await _context.SaveChangesAsync();
            return supplier;
        }

        public async Task UpdateAsync(Supplier supplier)
        {
            _context.Suppliers.Update(supplier);
            await _context.SaveChangesAsync();
        }
    }
}