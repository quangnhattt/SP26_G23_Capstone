namespace AGMS.Domain.Entities;

public class MembershipRank
{
    public int RankID { get; set; }
    public string RankName { get; set; } = null!;
    public decimal MinSpending { get; set; }
    public decimal DiscountPercent { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
