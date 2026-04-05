using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Appointments;

public class ProposeRescheduleRequest
{
    [Required(ErrorMessage = "Vui lòng chọn thời gian đề xuất.")]
    public DateTime ProposedTime { get; set; }
}
