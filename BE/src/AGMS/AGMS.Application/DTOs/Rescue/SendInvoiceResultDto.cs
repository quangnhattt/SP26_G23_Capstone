namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi SA gửi hóa đơn (UC-RES-04 D3). BR-25.
/// </summary>
public class SendInvoiceResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public string InvoiceStatus { get; set; } = null!;

    /// <summary>Thời điểm gửi hóa đơn (= DateTime.UtcNow tại thời điểm gọi API)</summary>
    public DateTime SentAt { get; set; }
}
