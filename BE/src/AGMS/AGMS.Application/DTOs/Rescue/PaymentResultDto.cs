namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phan hoi sau khi customer thanh toan thanh cong.
/// </summary>
public class PaymentResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public PaymentInfoDto Payment { get; set; } = null!;
    public DateTime CompletedDate { get; set; }
    public decimal DepositAppliedAmount { get; set; }
}

/// <summary>
/// Chi tiet giao dich thanh toan.
/// </summary>
public class PaymentInfoDto
{
    public int TransactionId { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public decimal Amount { get; set; }
    public string? TransactionReference { get; set; }
    public string PaymentStatus { get; set; } = null!;
    public DateTime PaymentDate { get; set; }
}
