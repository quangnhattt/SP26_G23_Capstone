namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi SA hoàn tất kéo xe (UC-RES-03 C3).
/// Bao gồm thông tin Repair Order vừa được tạo theo BR-19 (SMC07).
/// </summary>
public class CompleteTowingResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;

    /// <summary>Repair Order được tạo tự động theo BR-19</summary>
    public TowingMaintenanceDto? ResultingMaintenance { get; set; }
}

/// <summary>
/// Thông tin Repair Order được tạo khi kéo xe hoàn tất (BR-19)
/// </summary>
public class TowingMaintenanceDto
{
    public int MaintenanceId { get; set; }
    public string MaintenanceType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime CreatedDate { get; set; }
}
