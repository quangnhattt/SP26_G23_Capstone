using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Supplier
{
    public class UpdateSupplierStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }
}
