namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi Customer thanh toán thành công (UC-RES-04 D5).
/// BR-23: giao dịch được ghi nhận. SMP03, SMP05.
/// </summary>
public class PaymentResultDto
{
    public int RescueId { get; set; }

    /// <summary>Trạng thái rescue sau khi thanh toán = COMPLETED</summary>
    public string Status { get; set; } = null!;

    /// <summary>Thông tin giao dịch thanh toán (BR-23)</summary>
    public PaymentInfoDto Payment { get; set; } = null!;

    /// <summary>Thời điểm rescue được đánh dấu hoàn tất</summary>
    public DateTime CompletedDate { get; set; }
}

/// <summary>
/// Chi tiết giao dịch thanh toán — ánh xạ từ PaymentTransaction entity (BR-23)
/// </summary>
public class PaymentInfoDto
{
    public int TransactionId { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public decimal Amount { get; set; }
    public string? TransactionReference { get; set; }

    /// <summary>Trạng thái giao dịch: SUCCESS</summary>
    public string PaymentStatus { get; set; } = null!;
    public DateTime PaymentDate { get; set; }
}
