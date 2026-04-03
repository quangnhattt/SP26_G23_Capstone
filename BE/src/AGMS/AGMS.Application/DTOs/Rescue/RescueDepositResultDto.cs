namespace AGMS.Application.DTOs.Rescue;

public class RescueDepositResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public decimal DepositAmount { get; set; }
    public bool IsDepositPaid { get; set; }
    public DateTime? DepositPaidDate { get; set; }
    public bool IsDepositConfirmed { get; set; }
    public DateTime? DepositConfirmedDate { get; set; }
    public int? DepositConfirmedById { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public string? TransactionReference { get; set; }
}
