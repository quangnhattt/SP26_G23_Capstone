using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO Customer chấp nhận hóa đơn (UC-RES-04 D4).
/// Actor: Customer — validate phải là CustomerID của rescue. BR-18.
/// Status transition: INVOICE_SENT → PAYMENT_PENDING.
/// AF-01: Customer khiếu nại → gọi dispute endpoint (UC-RES-05).
/// </summary>
public class AcceptInvoiceDto
{
    /// <summary>ID khách hàng chấp nhận — validate ownership của rescue request (BR-03)</summary>
    [Required(ErrorMessage = "CustomerId là bắt buộc.")]
    public int CustomerId { get; set; }
}
