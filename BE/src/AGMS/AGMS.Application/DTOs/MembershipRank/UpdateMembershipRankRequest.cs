using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.MembershipRank
{
    public class UpdateMembershipRankRequest
    {
        [Required(ErrorMessage = "MSG_MR01: Rank name is required.")]
        [StringLength(100, ErrorMessage = "MSG_MR02: Rank name cannot exceed 100 characters.")]
        [DefaultValue("VIP Vàng")]
        public string RankName { get; set; } = null!;

        [Range(0, 9999999999999.99, ErrorMessage = "MSG_MR03: Minimum spending cannot be negative.")]
        [DefaultValue(50000000)]
        public decimal MinSpending { get; set; }

        [Range(0, 100, ErrorMessage = "MSG_MR04: Discount percent must be between 0 and 100.")]
        [DefaultValue(10.5)]
        public decimal DiscountPercent { get; set; }

        [DefaultValue("Khách hàng chi tiêu trên 50 triệu")]
        public string? Description { get; set; }

        [DefaultValue(true)]
        public bool IsActive { get; set; }
    }
}