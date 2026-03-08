namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO kỹ thuật viên đang rảnh — SA dùng để tham chiếu khi đánh giá yêu cầu (UC-RES-01 Step 4, BR-28)
/// </summary>
public class AvailableTechnicianDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string? Phone { get; set; }

    /// <summary>Kỹ năng chuyên môn của kỹ thuật viên</summary>
    public string? Skills { get; set; }

    /// <summary>Luôn false trong response — đã lọc sẵn chỉ lấy người không đang trực cứu hộ</summary>
    public bool IsOnRescueMission { get; set; }

    /// <summary>Số Repair Order đang xử lý (chưa COMPLETED hoặc CANCELLED)</summary>
    public int ActiveJobCount { get; set; }
}
