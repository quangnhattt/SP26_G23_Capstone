namespace AGMS.Application.DTOs.Scheduling;

/// <summary>
/// Thông tin 1 khung giờ (slot) trong ngày.
/// </summary>
public class SlotAvailabilityDto
{
    /// <summary>Số thứ tự slot (1-9)</summary>
    public int SlotIndex { get; set; }

    /// <summary>Giờ bắt đầu, ví dụ "08:00"</summary>
    public string StartTime { get; set; } = null!;

    /// <summary>Giờ kết thúc, ví dụ "09:00"</summary>
    public string EndTime { get; set; } = null!;

    /// <summary>Số xe đã đặt trong slot này</summary>
    public int BookedCount { get; set; }

    /// <summary>Tổng số KTV active (sức chứa tối đa)</summary>
    public int Capacity { get; set; }

    /// <summary>Số KTV còn rảnh = Capacity - BookedCount</summary>
    public int AvailableCount { get; set; }

    /// <summary>Slot còn chỗ hay không</summary>
    public bool IsAvailable { get; set; }
}

/// <summary>
/// Thông tin các slot khả dụng trong 1 ngày.
/// </summary>
public class DayAvailabilityDto
{
    public string Date { get; set; } = null!;
    public int TotalTechnicians { get; set; }
    public List<SlotAvailabilityDto> Slots { get; set; } = new();
}
