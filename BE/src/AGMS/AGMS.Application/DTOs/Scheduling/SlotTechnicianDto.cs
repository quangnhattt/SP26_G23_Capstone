namespace AGMS.Application.DTOs.Scheduling;

/// <summary>
/// Thông tin KTV khả dụng trong 1 slot cụ thể.
/// </summary>
public class SlotTechnicianDto
{
    public int TechnicianId { get; set; }
    public string FullName { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Skills { get; set; }

    /// <summary>true = KTV chưa có lịch hẹn trong slot này → có thể chọn</summary>
    public bool IsAvailableInSlot { get; set; }

    /// <summary>Số job trong ngày (cân bằng tải)</summary>
    public int CurrentJobCount { get; set; }
}
