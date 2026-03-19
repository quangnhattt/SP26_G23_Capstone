namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi Customer tạo khiếu nại hóa đơn (UC-RES-05 E1). SMC12.
/// </summary>
public class DisputeCreatedResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;

    /// <summary>Thông tin khiếu nại vừa được ghi nhận</summary>
    public DisputeInfoDto Dispute { get; set; } = null!;
}

/// <summary>
/// Chi tiết khiếu nại hóa đơn.
/// Lưu ý: DisputeId dùng MaintenanceID làm định danh (không có Dispute entity riêng).
/// Reason được lưu vào CarMaintenance.Notes với prefix [DISPUTE].
/// </summary>
public class DisputeInfoDto
{
    /// <summary>Định danh khiếu nại = ResultingMaintenanceID của rescue (hoặc RescueID nếu không có)</summary>
    public int DisputeId { get; set; }
    public string Reason { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    /// <summary>Thời điểm xử lý tranh chấp — null cho đến khi SA resolve</summary>
    public DateTime? ResolvedAt { get; set; }
}
