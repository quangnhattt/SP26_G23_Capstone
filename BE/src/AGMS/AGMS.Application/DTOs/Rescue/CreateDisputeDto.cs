using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO Customer tạo khiếu nại hóa đơn (UC-RES-05 E1).
/// Actor: Customer — BR-26 (audit log), SMC12.
/// Status transition: INVOICE_SENT → INVOICE_DISPUTED.
/// </summary>
public class CreateDisputeDto
{
    /// <summary>ID khách hàng khiếu nại — validate phải là CustomerID của rescue (BR-03)</summary>
    [Required(ErrorMessage = "CustomerId là bắt buộc.")]
    public int CustomerId { get; set; }

    /// <summary>Lý do khiếu nại hóa đơn (bắt buộc). Max 1000 ký tự.</summary>
    [Required(ErrorMessage = "Reason là bắt buộc.")]
    [MaxLength(1000, ErrorMessage = "Reason không được vượt quá 1000 ký tự.")]
    public string Reason { get; set; } = null!;
}
