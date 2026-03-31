using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO Customer thuc hien thanh toan (UC-RES-04 D5).
/// Actor: Customer. Status transition: PAYMENT_PENDING -> COMPLETED.
/// </summary>
public class ProcessPaymentDto
{
    /// <summary>Phuong thuc thanh toan: CASH, CARD, TRANSFER, EWALLET.</summary>
    [Required(ErrorMessage = "PaymentMethod la bat buoc.")]
    public string PaymentMethod { get; set; } = null!;

    /// <summary>So tien thanh toan phai khop voi so tien con lai cua hoa don.</summary>
    [Required(ErrorMessage = "Amount la bat buoc.")]
    [Range(0, double.MaxValue, ErrorMessage = "Amount phai >= 0.")]
    public decimal Amount { get; set; }

    /// <summary>Ma giao dich ngan hang/vi dien tu. Max 100 ky tu.</summary>
    [MaxLength(100, ErrorMessage = "TransactionReference khong duoc vuot qua 100 ky tu.")]
    public string? TransactionReference { get; set; }
}
