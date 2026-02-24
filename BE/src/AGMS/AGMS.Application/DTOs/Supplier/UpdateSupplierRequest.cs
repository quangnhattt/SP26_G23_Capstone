using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.Supplier
{
    public class UpdateSupplierRequest
    {
        [Required(ErrorMessage = "MSG_SUP01: Supplier name is required.")]
        [StringLength(200, ErrorMessage = "MSG_SUP02: Name cannot exceed 200 characters.")]
        public string Name { get; set; } = null!;

        public string? Address { get; set; }

        [RegularExpression(@"^(03|05|07|08|09)\d{8}$", ErrorMessage = "MSG_SUP03: Invalid Vietnamese phone number format (must be 10 digits).")]
        public string? Phone { get; set; }

        [RegularExpression(@"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$", ErrorMessage = "MSG_SUP04: Invalid email format. Example: user@domain.com")]
        [DefaultValue("contact@thanhdat.com")]
        public string? Email { get; set; }
        
        public string? Description { get; set; }

        [DefaultValue(true)]
        public bool IsActive { get; set; }
    }
}