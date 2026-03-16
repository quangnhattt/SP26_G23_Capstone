namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi SA hủy yêu cầu cứu hộ (UC-RES-06 F1). SMC06.
/// </summary>
public class CancelRescueResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;

    /// <summary>Thời điểm hủy</summary>
    public DateTime CancelledAt { get; set; }

    /// <summary>Lý do hủy (có thể null nếu SA không cung cấp)</summary>
    public string? Reason { get; set; }
}
