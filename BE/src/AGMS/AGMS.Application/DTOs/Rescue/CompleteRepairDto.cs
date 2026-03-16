using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body khi kỹ thuật viên hoàn thành sửa chữa tại chỗ (UC-RES-02 Step 8)
/// </summary>
public class CompleteRepairDto
{
    /// <summary>Ghi chú hoàn thành — lưu vào CarMaintenance.Notes (tùy chọn)</summary>
    [MaxLength(500)]
    public string? CompletionNotes { get; set; }
}
