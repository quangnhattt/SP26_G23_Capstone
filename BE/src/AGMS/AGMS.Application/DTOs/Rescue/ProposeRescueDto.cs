using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body khi SA gửi đề xuất hướng xử lý cho khách hàng (UC-RES-01 Step 5-6)
/// </summary>
public class ProposeRescueDto
{
    /// <summary>ID của Service Advisor thực hiện đề xuất (BR-17)</summary>
    [Required(ErrorMessage = "ID Service Advisor là bắt buộc.")]
    public int ServiceAdvisorId { get; set; }

    /// <summary>
    /// Loại đề xuất: ROADSIDE (sửa tại chỗ) hoặc TOWING (kéo xe về xưởng)
    /// </summary>
    [Required(ErrorMessage = "Loại cứu hộ là bắt buộc.")]
    [RegularExpression("^(ROADSIDE|TOWING)$", ErrorMessage = "Loại cứu hộ phải là ROADSIDE hoặc TOWING.")]
    public string RescueType { get; set; } = null!;

    /// <summary>
    /// Ghi chú đề xuất của SA gửi cho khách hàng (không lưu DB — chỉ dùng nội bộ/log)
    /// </summary>
    [MaxLength(500)]
    public string? ProposalNotes { get; set; }

    /// <summary>Phí cứu hộ ước tính — cập nhật vào ServiceFee của rescue request</summary>
    [Range(0, double.MaxValue, ErrorMessage = "Phí cứu hộ phải >= 0.")]
    public decimal? EstimatedServiceFee { get; set; }
}
