using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body khi kỹ thuật viên hoàn thành sửa chữa tại chỗ (UC-RES-02 Step 8)
/// </summary>
public class CompleteRepairDto
{
    /// <summary>ID kỹ thuật viên — phải là AssignedTechnicianID của rescue</summary>
    [Required(ErrorMessage = "ID kỹ thuật viên là bắt buộc.")]
    public int TechnicianId { get; set; }

    /// <summary>Ghi chú hoàn thành — lưu vào CarMaintenance.Notes (tùy chọn)</summary>
    [MaxLength(500)]
    public string? CompletionNotes { get; set; }
}
