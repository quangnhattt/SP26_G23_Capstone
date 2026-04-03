using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Unit
{
    public class UpdateUnitStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }
}
