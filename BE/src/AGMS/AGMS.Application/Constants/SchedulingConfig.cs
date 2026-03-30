namespace AGMS.Application.Constants;

/// <summary>
/// Cấu hình khung giờ đặt lịch hẹn.
/// 9 slot/ngày, mỗi slot 1 tiếng, từ 08:00 đến 17:00.
/// Capacity mỗi slot = số KTV active (1 KTV = 1 xe/slot).
/// </summary>
public static class SchedulingConfig
{
    public static readonly TimeOnly WorkStart = new(8, 0);
    public static readonly TimeOnly WorkEnd = new(17, 0);
    public const int SlotDurationMinutes = 60;

    /// <summary>
    /// 9 khung giờ bắt đầu: 08:00, 09:00, ..., 16:00
    /// </summary>
    public static readonly TimeOnly[] SlotStartTimes =
    {
        new(8, 0), new(9, 0), new(10, 0),
        new(11, 0), new(12, 0), new(13, 0),
        new(14, 0), new(15, 0), new(16, 0)
    };

    /// <summary>
    /// Tìm slot chứa giờ chỉ định. Trả về index (0-based) hoặc -1 nếu không hợp lệ.
    /// </summary>
    public static int FindSlotIndex(TimeOnly time)
    {
        for (int i = 0; i < SlotStartTimes.Length; i++)
        {
            var slotEnd = SlotStartTimes[i].AddMinutes(SlotDurationMinutes);
            if (time >= SlotStartTimes[i] && time < slotEnd)
                return i;
        }
        return -1;
    }

    /// <summary>
    /// Kiểm tra giờ có phải là giờ bắt đầu slot hợp lệ không.
    /// </summary>
    public static bool IsValidSlotStartTime(TimeOnly time)
    {
        return Array.Exists(SlotStartTimes, s => s == time);
    }
}
