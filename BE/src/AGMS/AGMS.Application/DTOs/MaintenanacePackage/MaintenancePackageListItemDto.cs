using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.MaintenanacePackage
{
    public class MaintenancePackageListItemDto
    {
        public int PackageID { get; set; }
        public string PackageCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public decimal BasePrice { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal? FinalPrice { get; set; }
        public bool IsActive { get; set; }
    }
}
