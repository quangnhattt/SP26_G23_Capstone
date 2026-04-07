using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.ServiceOrder;

public class TechnicianAssignmentRequest
{
    [Required]
    public int TechnicianId { get; set; }
}
