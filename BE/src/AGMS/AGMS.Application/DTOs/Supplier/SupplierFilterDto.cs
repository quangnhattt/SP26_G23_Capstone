using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.Supplier
{
    public class SupplierFilterDto
    {
        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 10;

        public string? SearchTerm { get; set; }
        public bool? IsActive { get; set; }
    }
}