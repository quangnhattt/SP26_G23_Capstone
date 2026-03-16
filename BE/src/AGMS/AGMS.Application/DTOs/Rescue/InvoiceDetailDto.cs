namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO chi tiết hóa đơn cứu hộ — dùng chung cho D1 (tạo) và D2 (GET).
/// Phản ánh các trường tài chính lưu trong CarMaintenance (BR-24, BR-25).
/// </summary>
public class InvoiceDetailDto
{
    /// <summary>Phí cứu hộ cơ bản (baseAmount = RescueServiceFee SA nhập)</summary>
    public decimal BaseAmount { get; set; }

    /// <summary>Giảm giá thủ công do SA nhập</summary>
    public decimal ManualDiscountAmount { get; set; }

    /// <summary>Tên hạng thành viên áp dụng (BR-24). Null nếu khách không có rank.</summary>
    public string? MembershipRankApplied { get; set; }

    /// <summary>Phần trăm giảm giá theo hạng thành viên (BR-24)</summary>
    public decimal MemberDiscountPercent { get; set; }

    /// <summary>Số tiền giảm giá theo hạng thành viên (tính tự động)</summary>
    public decimal MemberDiscountAmount { get; set; }

    /// <summary>Thành tiền sau tất cả giảm giá</summary>
    public decimal FinalAmount { get; set; }

    /// <summary>Ghi chú hóa đơn</summary>
    public string? Notes { get; set; }

    /// <summary>Thời điểm tạo hóa đơn (= thời điểm CreateInvoice được gọi)</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Trạng thái hóa đơn: CREATED | SENT | ACCEPTED | PAID | DISPUTED</summary>
    public string InvoiceStatus { get; set; } = null!;

    /// <summary>Thời điểm gửi hóa đơn. Null nếu chưa gửi (entity không lưu riêng).</summary>
    public DateTime? SentAt { get; set; }
}
