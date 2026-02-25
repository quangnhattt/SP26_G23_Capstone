using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MembershipRank;
using AGMS.Application.DTOs.Unit;
using AGMS.Domain.Entities;

namespace AGMS.Infrastructure.Services
{
    public class MembershipRankService : IMembershipRankService
    {
        private readonly IMembershipRankRepository _repository;

        public MembershipRankService(IMembershipRankRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedResult<MembershipRankDto>> GetRanksAsync(MembershipRankFilterDto filter)
        {
            return await _repository.GetRanksAsync(filter);
        }

        public async Task<MembershipRankDto?> GetRankByIdAsync(int id)
        {
            var rank = await _repository.GetByIdAsync(id);
            if (rank == null) return null;

            return new MembershipRankDto
            {
                RankID = rank.RankID,
                RankName = rank.RankName,
                MinSpending = rank.MinSpending,
                DiscountPercent = rank.DiscountPercent,
                Description = rank.Description,
                IsActive = rank.IsActive
            };
        }

        public async Task<(bool IsSuccess, string Message, MembershipRankDto? Data)> CreateRankAsync(CreateMembershipRankRequest request)
        {
            if (await _repository.IsRankNameExistsAsync(request.RankName))
            {
                return (false, "MSG_MR05: Membership Rank name already exists.", null);
            }

            if (await _repository.IsMinSpendingExistsAsync(request.MinSpending))
            {
                return (false, "MSG_MR09: Minimum spending amount already exists for another rank.", null);
            }
            if (await _repository.IsDiscountPercentExistsAsync(request.DiscountPercent))
            {
                return (false, "MSG_MR10: Discount percent already exists for another rank.", null);
            }

            var newRank = new MembershipRank
            {
                RankName = request.RankName.Trim(),
                MinSpending = request.MinSpending,
                DiscountPercent = request.DiscountPercent,
                Description = request.Description?.Trim(),
                IsActive = true
            };

            await _repository.AddAsync(newRank);

            var resultDto = new MembershipRankDto
            {
                RankID = newRank.RankID,
                RankName = newRank.RankName,
                MinSpending = newRank.MinSpending,
                DiscountPercent = newRank.DiscountPercent,
                Description = newRank.Description,
                IsActive = newRank.IsActive
            };

            return (true, "MSG_MR06: Membership Rank created successfully.", resultDto);
        }

        public async Task<(bool IsSuccess, string Message)> UpdateRankAsync(int id, UpdateMembershipRankRequest request)
        {
            var existingRank = await _repository.GetByIdAsync(id);
            if (existingRank == null)
            {
                return (false, "MSG_MR07: Membership Rank not found.");
            }

            if (await _repository.IsRankNameExistsAsync(request.RankName, id))
            {
                return (false, "MSG_MR05: Membership Rank name already exists.");
            }

            if (await _repository.IsMinSpendingExistsAsync(request.MinSpending, id))
            {
                return (false, "MSG_MR09: Minimum spending amount already exists for another rank.");
            }
            if (await _repository.IsDiscountPercentExistsAsync(request.DiscountPercent, id))
            {
                return (false, "MSG_MR10: Discount percent already exists for another rank.");
            }
            existingRank.RankName = request.RankName.Trim();
            existingRank.MinSpending = request.MinSpending;
            existingRank.DiscountPercent = request.DiscountPercent;
            existingRank.Description = request.Description?.Trim();
            existingRank.IsActive = request.IsActive;

            await _repository.UpdateAsync(existingRank);

            return (true, "MSG_MR08: Membership Rank updated successfully.");
        }
    }
}