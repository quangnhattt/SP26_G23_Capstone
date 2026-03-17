using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO Customer thực hiện thanh toán (UC-RES-04 D5).
/// Actor: Customer — BR-23 (ghi nhận giao dịch), BR-25 (bảo mật), BR-26 (audit log). SMP03, SMP05.
/// Status transition: PAYMENT_PENDING → COMPLETED.
/// </summary>
public class ProcessPaymentDto
{
    /// <summary>Phương thức thanh toán: CASH, CARD, TRANSFER, EWALLET (SMP07 nếu không hợp lệ)</summary>
    [Required(ErrorMessage = "PaymentMethod là bắt buộc.")]
    public string PaymentMethod { get; set; } = null!;

    /// <summary>Số tiền thanh toán — phải khớp với finalAmount của hóa đơn (BR-23)</summary>
    [Required(ErrorMessage = "Amount là bắt buộc.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount phải lớn hơn 0.")]
    public decimal Amount { get; set; }

    /// <summary>Mã giao dịch ngân hàng/ví điện tử. Max 100 ký tự.</summary>
    [MaxLength(100, ErrorMessage = "TransactionReference không được vượt quá 100 ký tự.")]
    public string? TransactionReference { get; set; }
}
