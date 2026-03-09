namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi SA/System đánh dấu yêu cầu cứu hộ là Spam (UC-RES-06 F2). SMC14, SMC06.
/// Status cuối = CANCELLED (qua trung gian SPAM).
/// </summary>
public class MarkSpamResultDto
{
    public int RescueId { get; set; }

    /// <summary>Trạng thái cuối = CANCELLED</summary>
    public string Status { get; set; } = null!;

    public bool MarkedAsSpam { get; set; } = true;

    /// <summary>Lý do đánh dấu Spam (có thể null)</summary>
    public string? SpamReason { get; set; }

    /// <summary>Thời điểm đánh dấu Spam</summary>
    public DateTime MarkedAt { get; set; }
}
