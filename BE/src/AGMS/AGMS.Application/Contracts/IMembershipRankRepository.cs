using AGMS.Application.DTOs.MembershipRank; 
using AGMS.Application.DTOs.Unit;
using AGMS.Domain.Entities;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IMembershipRankRepository
    {
        Task<PagedResult<MembershipRankDto>> GetRanksAsync(MembershipRankFilterDto filter);
        Task<MembershipRank?> GetByIdAsync(int id);

        // BR-MR-01: Check trùng tên Hạng thành viên
        Task<bool> IsRankNameExistsAsync(string name, int? excludeId = null);

        // Check xem có Khách hàng (User) nào đang mang Hạng này không (Để cấm xóa/ẩn nếu đang có người dùng)
        Task<bool> HasUsersInRankAsync(int rankId);

        // Kiểm tra trùng Mốc chi tiêu (MinSpending)
        Task<bool> IsMinSpendingExistsAsync(decimal minSpending, int? excludeId = null);

        // Kiểm tra trùng % Giảm giá (DiscountPercent)
        Task<bool> IsDiscountPercentExistsAsync(decimal discountPercent, int? excludeId = null);
        Task<MembershipRank> AddAsync(MembershipRank rank);
        Task UpdateAsync(MembershipRank rank);
    }
}