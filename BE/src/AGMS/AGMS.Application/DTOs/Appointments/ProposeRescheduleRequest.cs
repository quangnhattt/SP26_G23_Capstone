using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Appointments;

public class ProposeRescheduleRequest
{
    [Required(ErrorMessage = "Vui lòng nhập lý do đề xuất dời lịch.")]
    public string Reason { get; set; } = null!;
}
