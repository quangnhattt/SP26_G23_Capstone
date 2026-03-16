using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO SA hủy yêu cầu cứu hộ (UC-RES-06 F1).
/// Actor: SA — BR-18 (không thể hủy khi đã COMPLETED), BR-26 (audit log). SMC06.
/// Status transition: Bất kỳ trạng thái nào (trừ COMPLETED/CANCELLED) → CANCELLED.
/// </summary>
public class CancelRescueDto
{
    /// <summary>Lý do hủy (tùy chọn). Max 500 ký tự. Ghi vào audit log (BR-26).</summary>
    [MaxLength(500, ErrorMessage = "Reason không được vượt quá 500 ký tự.")]
    public string? Reason { get; set; }
}
