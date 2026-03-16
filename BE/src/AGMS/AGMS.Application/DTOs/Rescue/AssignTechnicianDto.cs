using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body khi SA điều phối kỹ thuật viên cho cứu hộ (UC-RES-02 Step 1-2, BR-17)
/// </summary>
public class AssignTechnicianDto
{
    /// <summary>ID kỹ thuật viên được chọn — phải IsActive và chưa đang thực hiện nhiệm vụ cứu hộ</summary>
    [Required(ErrorMessage = "ID kỹ thuật viên là bắt buộc.")]
    public int TechnicianId { get; set; }

    /// <summary>Thời gian dự kiến đến hiện trường (tùy chọn)</summary>
    public DateTime? EstimatedArrivalDateTime { get; set; }
}
