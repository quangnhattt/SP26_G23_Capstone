using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body khi SA gửi đề xuất hướng xử lý cho khách hàng (UC-RES-01 Step 5-6)
/// </summary>
public class ProposeRescueDto
{
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

    /// <summary>
    /// Số tiền đặt cọc SA đề xuất cho ca cứu hộ.
    /// Bắt buộc khi request này có RequiresDeposit = true.
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "Số tiền đặt cọc phải >= 0.")]
    public decimal? DepositAmount { get; set; }

    /// <summary>
    /// Danh sách phụ tùng SA dự kiến có thể sử dụng cho phương án đang đề xuất.
    /// Mỗi phụ tùng có số lượng riêng để không mất thông tin khi FE hiển thị/chốt phương án.
    /// </summary>
    public List<SuggestedRescuePartDto> SuggestedParts { get; set; } = [];
}
