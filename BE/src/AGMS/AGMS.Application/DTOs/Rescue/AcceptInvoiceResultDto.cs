namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi Customer chấp nhận hóa đơn (UC-RES-04 D4).
/// </summary>
public class AcceptInvoiceResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public string InvoiceStatus { get; set; } = null!;

    /// <summary>Thành tiền cần thanh toán</summary>
    public decimal FinalAmount { get; set; }
}
