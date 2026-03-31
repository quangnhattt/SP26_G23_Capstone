namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO chi tiet hoa don cuu ho.
/// </summary>
public class InvoiceDetailDto
{
    public decimal BaseAmount { get; set; }
    public decimal ManualDiscountAmount { get; set; }
    public string? MembershipRankApplied { get; set; }
    public decimal MemberDiscountPercent { get; set; }
    public decimal MemberDiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public decimal DepositAppliedAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string InvoiceStatus { get; set; } = null!;
    public DateTime? SentAt { get; set; }
}
