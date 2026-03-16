using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body ghi nhận sự chấp thuận/từ chối sửa chữa tại chỗ của khách hàng
/// (UC-RES-02 Step 5, BR-RES-01)
/// </summary>
public class CustomerConsentDto
{
    /// <summary>ID người thực hiện (Customer hoặc SA ghi nhận thay mặt)</summary>
    [Required(ErrorMessage = "ID người thực hiện là bắt buộc.")]
    public int ActorId { get; set; }

    /// <summary>
    /// true = Chấp thuận sửa tại chỗ → tiếp tục UC-RES-02.
    /// false = Từ chối → chuyển sang nhánh kéo xe PROPOSED_TOWING (AF-02)
    /// </summary>
    [Required]
    public bool ConsentGiven { get; set; }

    /// <summary>Ghi chú của khách hàng về quyết định (tùy chọn)</summary>
    [MaxLength(255)]
    public string? ConsentNotes { get; set; }
}
