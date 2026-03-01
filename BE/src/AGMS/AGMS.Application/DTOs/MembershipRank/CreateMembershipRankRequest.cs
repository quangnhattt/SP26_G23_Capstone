using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.MembershipRank
{
    public class CreateMembershipRankRequest
    {
        [Required(ErrorMessage = "MSG_MR01: Rank name is required.")]
        [StringLength(100, ErrorMessage = "MSG_MR02: Rank name cannot exceed 100 characters.")]
        [DefaultValue("VIP Vàng")]
        public string RankName { get; set; } = null!;

        // BR-MR-03: Mức chi tiêu phải >= 0
        [Range(0, 9999999999999.99, ErrorMessage = "MSG_MR03: Minimum spending cannot be negative.")]
        [DefaultValue(50000000)] // Ví dụ: Tiêu 50 triệu thì lên VIP Vàng
        public decimal MinSpending { get; set; }

        // BR-MR-02: Giảm giá từ 0% đến 100%
        [Range(0, 100, ErrorMessage = "MSG_MR04: Discount percent must be between 0 and 100.")]
        [DefaultValue(10.5)] // Giảm 10.5%
        public decimal DiscountPercent { get; set; }

        [DefaultValue("Khách hàng chi tiêu trên 50 triệu")]
        public string? Description { get; set; }
    }
}