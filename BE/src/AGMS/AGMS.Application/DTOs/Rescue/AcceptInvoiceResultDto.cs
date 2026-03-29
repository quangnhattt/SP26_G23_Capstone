namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phan hoi sau khi customer chap nhan hoa don.
/// </summary>
public class AcceptInvoiceResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public string InvoiceStatus { get; set; } = null!;
    public decimal FinalAmount { get; set; }
    public decimal DepositAppliedAmount { get; set; }
}
