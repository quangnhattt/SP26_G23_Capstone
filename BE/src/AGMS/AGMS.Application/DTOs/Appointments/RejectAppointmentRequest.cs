using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Appointments;

public class RejectAppointmentRequest
{
    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = null!;
}
