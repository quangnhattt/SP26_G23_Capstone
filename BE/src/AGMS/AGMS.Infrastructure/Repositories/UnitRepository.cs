using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Unit;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Repositories
{
    public class UnitRepository : IUnitRepository
    {
        private readonly CarServiceDbContext _context;

        public UnitRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // 1. LẤY DANH SÁCH (CÓ PHÂN TRANG & TÌM KIẾM)
        // =========================================================
        public async Task<PagedResult<UnitDto>> GetUnitsAsync(UnitFilterDto filter)
        {
            var query = _context.Units.AsQueryable();

            // 1. Lọc theo trạng thái (Active / Inactive) nếu Frontend có truyền lên
            if (filter.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == filter.IsActive.Value);
            }

            // 2. Lọc theo từ khóa (Dùng Like để không phân biệt hoa/thường)
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var searchTerm = $"%{filter.SearchTerm.Trim()}%";
                query = query.Where(u =>
                    EF.Functions.Like(u.Name, searchTerm) ||
                    (u.Description != null && EF.Functions.Like(u.Description, searchTerm))
                );
            }

            // 3. Lọc theo Type
            if (!string.IsNullOrWhiteSpace(filter.Type))
            {
                var typeKeyword = filter.Type.Trim().ToUpper();
                query = query.Where(u => u.Type != null && u.Type.ToUpper() == typeKeyword);
            }

            // 4. Đếm tổng số bản ghi thỏa mãn điều kiện
            var totalCount = await query.CountAsync();

            // 5. Phân trang & Chuyển đổi sang DTO (Bổ sung thêm trường IsActive trả về)
            var items = await query
                .OrderBy(u => u.UnitID)
                .Skip((filter.PageIndex - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(u => new UnitDto
                {
                    UnitID = u.UnitID,
                    Name = u.Name,
                    Type = u.Type,
                    Description = u.Description,
                    IsActive = u.IsActive // Nên trả về cả trạng thái để Frontend biết cái nào đang bị xóa
                })
                .ToListAsync();

            return new PagedResult<UnitDto>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        // =========================================================
        // 2. CÁC HÀM KIỂM TRA & THÊM MỚI (ADD)
        // =========================================================
        public async Task<bool> IsUnitNameExistsAsync(string name)
        {
            var normalizedName = name.Trim().ToLower();
            // Check trùng với những thằng ĐANG HOẠT ĐỘNG
            return await _context.Units.AnyAsync(u => u.Name.ToLower() == normalizedName);
        }

        public async Task<Unit> AddUnitAsync(Unit unit)
        {
            unit.IsActive = true;
            await _context.Units.AddAsync(unit);
            await _context.SaveChangesAsync();
            return unit;
        }

        // =========================================================
        // 3. CÁC HÀM CẬP NHẬT (EDIT)
        // =========================================================
        public async Task<Unit?> GetUnitByIdAsync(int id)
        {
            return await _context.Units.FindAsync(id);
        }

        public async Task<bool> IsUnitNameExistsAsync(string name, int excludeId)
        {
            var normalizedName = name.Trim().ToLower();
            return await _context.Units.AnyAsync(u =>
                u.Name.ToLower() == normalizedName &&
                u.UnitID != excludeId);
        }

        public async Task UpdateUnitAsync(Unit unit)
        {
            _context.Units.Update(unit);
            await _context.SaveChangesAsync();
        }

        // =========================================================
        // 4. CÁC HÀM XÓA MỀM (DELETE)
        // =========================================================
        public async Task<bool> IsUnitInUseAsync(int unitId)
        {
            // Kiểm tra bảng Product có dùng Unit này không
            return await _context.Products.AnyAsync(p => p.UnitID == unitId && p.IsActive == true);
        }

        public async Task SoftDeleteUnitAsync(int unitId)
        {
            var unit = await _context.Units.FindAsync(unitId);
            if (unit != null)
            {
                unit.IsActive = false; // Xóa mềm
                await _context.SaveChangesAsync();
            }
        }
    } 
} 