namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi SA điều phối dịch vụ kéo xe (UC-RES-03 C1).
/// Bao gồm thông tin điều phối kéo xe và trạng thái mới của rescue.
/// Lưu ý: TowingNotes được echo từ request vì entity RescueRequest không có field riêng.
/// </summary>
public class TowingDispatchResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public string? RescueType { get; set; }

    /// <summary>Ghi chú dịch vụ kéo xe (echo từ request)</summary>
    public string? TowingNotes { get; set; }

    /// <summary>Dự kiến thời gian kéo xe đến — đã lưu vào EstimatedArrivalDateTime</summary>
    public DateTime? EstimatedArrival { get; set; }

    /// <summary>Phí kéo xe ước tính — đã lưu vào ServiceFee</summary>
    public decimal? TowingServiceFee { get; set; }
}
