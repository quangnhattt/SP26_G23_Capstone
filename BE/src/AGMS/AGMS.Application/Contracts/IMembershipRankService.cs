using AGMS.Application.DTOs.MembershipRank;
using AGMS.Application.DTOs.Unit;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IMembershipRankService
    {
        Task<PagedResult<MembershipRankDto>> GetRanksAsync(MembershipRankFilterDto filter);
        Task<MembershipRankDto?> GetRankByIdAsync(int id);
        Task<(bool IsSuccess, string Message, MembershipRankDto? Data)> CreateRankAsync(CreateMembershipRankRequest request);
        Task<(bool IsSuccess, string Message)> UpdateRankAsync(int id, UpdateMembershipRankRequest request);
    }
}