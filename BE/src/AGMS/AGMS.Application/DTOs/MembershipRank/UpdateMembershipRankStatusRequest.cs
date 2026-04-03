using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.MembershipRank
{
    public class UpdateMembershipRankStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }
}
