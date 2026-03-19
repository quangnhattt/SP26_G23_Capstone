using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body cho các hành động đơn giản của kỹ thuật viên (accept-job, arrive)
/// </summary>
public class TechnicianActionDto
{
    /// <summary>ID kỹ thuật viên thực hiện hành động — phải là AssignedTechnicianID của rescue</summary>
    [Required(ErrorMessage = "ID kỹ thuật viên là bắt buộc.")]
    public int TechnicianId { get; set; }
}
