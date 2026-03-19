using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body khi kỹ thuật viên bắt đầu chẩn đoán tại hiện trường (UC-RES-02 Step 6)
/// </summary>
public class StartDiagnosisDto
{
    /// <summary>ID kỹ thuật viên — phải là AssignedTechnicianID của rescue</summary>
    [Required(ErrorMessage = "ID kỹ thuật viên là bắt buộc.")]
    public int TechnicianId { get; set; }

    /// <summary>Kết quả chẩn đoán sơ bộ — lưu vào CarMaintenance.Notes</summary>
    [Required(ErrorMessage = "Ghi chú chẩn đoán là bắt buộc.")]
    [MaxLength(1000)]
    public string DiagnosisNotes { get; set; } = null!;

    /// <summary>
    /// true = Có thể sửa tại chỗ → tạo Repair Order, status → DIAGNOSING.
    /// false = Không thể sửa tại chỗ → status → PROPOSED_TOWING (AF-01)
    /// </summary>
    [Required]
    public bool CanRepairOnSite { get; set; }
}
