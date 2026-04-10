using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Appointments;

public class RespondRescheduleRequest
{
    [Required]
    public bool Accept { get; set; }

    [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "NewDate phải ở định dạng yyyy-MM-dd.")]
    public string? NewDate { get; set; }

    [RegularExpression(@"^(?:[01]\d|2[0-3]):[0-5]\d$", ErrorMessage = "NewTime phải ở định dạng HH:mm.")]
    public string? NewTime { get; set; }

    public string? Notes { get; set; }
}
