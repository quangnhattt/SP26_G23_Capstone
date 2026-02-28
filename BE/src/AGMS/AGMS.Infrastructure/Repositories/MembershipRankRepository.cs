using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MembershipRank;
using AGMS.Application.DTOs.Unit; // Đảm bảo namespace chứa PagedResult của bạn đúng ở đây
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories
{
    public class MembershipRankRepository : IMembershipRankRepository
    {
        private readonly CarServiceDbContext _context; // Đổi tên DbContext cho đúng với máy bạn nhé

        public MembershipRankRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<MembershipRankDto>> GetRanksAsync(MembershipRankFilterDto filter)
        {
            var query = _context.MembershipRanks.AsQueryable();

            // 1. Lọc theo từ khóa (Tìm theo Tên hạng)
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var term = filter.SearchTerm.Trim().ToLower();
                query = query.Where(r => r.RankName.ToLower().Contains(term));
            }

            // 2. Lọc theo trạng thái
            if (filter.IsActive.HasValue)
            {
                query = query.Where(r => r.IsActive == filter.IsActive.Value);
            }

            // 3. Đếm tổng số lượng
            var totalCount = await query.CountAsync();

            // 4. Phân trang & Sắp xếp (Ưu tiên Rank có mức chi tiêu từ thấp lên cao để dễ nhìn)
            var items = await query
                .OrderBy(r => r.MinSpending)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(r => new MembershipRankDto
                {
                    RankID = r.RankID,
                    RankName = r.RankName,
                    MinSpending = r.MinSpending,
                    DiscountPercent = r.DiscountPercent,
                    Description = r.Description,
                    IsActive = r.IsActive
                })
                .ToListAsync();

            return new PagedResult<MembershipRankDto>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        public async Task<MembershipRank?> GetByIdAsync(int id)
        {
            return await _context.MembershipRanks.FindAsync(id);
        }

        // Kiểm tra trùng tên
        public async Task<bool> IsRankNameExistsAsync(string name, int? excludeId = null)
        {
            var query = _context.MembershipRanks.AsQueryable();

            if (excludeId.HasValue)
            {
                query = query.Where(r => r.RankID != excludeId.Value);
            }

            return await query.AnyAsync(r => r.RankName.ToLower() == name.ToLower());
        }

        // Kiểm tra xem có user nào đang xài hạng này không (Dùng để chặn xóa)
        public async Task<bool> HasUsersInRankAsync(int rankId)
        {
            return await _context.Users.AnyAsync(u => u.CurrentRankID == rankId);
        }

        public async Task<bool> IsMinSpendingExistsAsync(decimal minSpending, int? excludeId = null)
        {
            var query = _context.MembershipRanks.AsQueryable();

            if (excludeId.HasValue)
            {
                // Bỏ qua chính nó khi đang Edit
                query = query.Where(r => r.RankID != excludeId.Value);
            }

            // So sánh xem có mốc tiền nào giống hệt không
            return await query.AnyAsync(r => r.MinSpending == minSpending);
        }

        public async Task<MembershipRank> AddAsync(MembershipRank rank)
        {
            _context.MembershipRanks.Add(rank);
            await _context.SaveChangesAsync();
            return rank;
        }

        public async Task UpdateAsync(MembershipRank rank)
        {
            _context.MembershipRanks.Update(rank);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsDiscountPercentExistsAsync(decimal discountPercent, int? excludeId = null)
        {
            var query = _context.MembershipRanks.AsQueryable();

            if (excludeId.HasValue)
            {
                // Bỏ qua chính nó khi đang Edit
                query = query.Where(r => r.RankID != excludeId.Value);
            }

            // So sánh xem có mức % giảm giá nào giống hệt không
            return await query.AnyAsync(r => r.DiscountPercent == discountPercent);
        }
    }
}