using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Users;

public class UpdateUserStatusRequest
{
    [Required]
    public bool IsActive { get; set; }
}
