using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO SA tạo hóa đơn cứu hộ (UC-RES-04 D1).
/// Actor: SA — BR-24 (tính member discount tự động), BR-25. SMC05, SMP02, SMP06.
/// Status transition: REPAIR_COMPLETE | TOWED → INVOICED.
/// </summary>
public class CreateInvoiceDto
{
    /// <summary>Tổng phí dịch vụ cứu hộ cơ bản (>= 0). Là baseAmount của hóa đơn.</summary>
    [Required(ErrorMessage = "RescueServiceFee là bắt buộc.")]
    [Range(0, double.MaxValue, ErrorMessage = "Phí dịch vụ không được âm.")]
    public decimal RescueServiceFee { get; set; }

    /// <summary>Giảm giá thủ công do SA nhập (>= 0, không vượt RescueServiceFee)</summary>
    [Range(0, double.MaxValue, ErrorMessage = "ManualDiscount không được âm.")]
    public decimal ManualDiscount { get; set; }

    /// <summary>Ghi chú hóa đơn. Max 500 ký tự.</summary>
    [MaxLength(500, ErrorMessage = "Notes không được vượt quá 500 ký tự.")]
    public string? Notes { get; set; }
}
