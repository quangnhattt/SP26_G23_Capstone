using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO SA xử lý tranh chấp hóa đơn (UC-RES-05 E2).
/// Actor: SA — BR-26 (audit log), BR-17. SMP02 (nếu reissue).
/// Status transition: INVOICE_DISPUTED → INVOICE_SENT.
/// </summary>
public class ResolveDisputeDto
{
    /// <summary>Ghi chú kết quả xử lý tranh chấp (bắt buộc). Max 500 ký tự.</summary>
    [Required(ErrorMessage = "ResolutionNotes là bắt buộc.")]
    [MaxLength(500, ErrorMessage = "ResolutionNotes không được vượt quá 500 ký tự.")]
    public string ResolutionNotes { get; set; } = null!;

    /// <summary>
    /// true = phát hành hóa đơn mới với giá điều chỉnh (cần AdjustedServiceFee).
    /// false = giữ nguyên hóa đơn cũ và gửi lại.
    /// </summary>
    [Required(ErrorMessage = "Reissue là bắt buộc.")]
    public bool Reissue { get; set; }

    /// <summary>Phí dịch vụ điều chỉnh — bắt buộc nếu Reissue=true. >= 0.</summary>
    [Range(0, double.MaxValue, ErrorMessage = "AdjustedServiceFee không được âm.")]
    public decimal? AdjustedServiceFee { get; set; }

    /// <summary>Giảm giá thủ công điều chỉnh — áp dụng khi Reissue=true. >= 0.</summary>
    [Range(0, double.MaxValue, ErrorMessage = "AdjustedManualDiscount không được âm.")]
    public decimal AdjustedManualDiscount { get; set; }
}
