using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.MembershipRank
{
    public class MembershipRankDto
    {
        public int RankID { get; set; }
        public string RankName { get; set; } = null!;
        public decimal MinSpending { get; set; }
        public decimal DiscountPercent { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
}
