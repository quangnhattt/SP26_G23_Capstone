using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Appointments;

public class RespondRescheduleRequest
{
    [Required]
    public bool Accept { get; set; }

    public string? Notes { get; set; }
}
