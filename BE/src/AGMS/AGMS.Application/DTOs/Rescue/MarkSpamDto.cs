using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO SA/System đánh dấu yêu cầu cứu hộ là Spam (UC-RES-06 F2, AF-01).
/// Actor: SA hoặc System — BR-18 (chỉ PENDING | REVIEWING), BR-26 (audit log). SMC14, SMC06.
/// Status transition: PENDING | REVIEWING → SPAM → CANCELLED.
/// </summary>
public class MarkSpamDto
{
    /// <summary>ID SA thực hiện đánh dấu spam — validate BR-03 (role SA)</summary>
    [Required(ErrorMessage = "ServiceAdvisorId là bắt buộc.")]
    public int ServiceAdvisorId { get; set; }

    /// <summary>Lý do đánh dấu Spam (tùy chọn). Max 500 ký tự. Ghi vào audit log (BR-26).</summary>
    [MaxLength(500, ErrorMessage = "SpamReason không được vượt quá 500 ký tự.")]
    public string? SpamReason { get; set; }
}
