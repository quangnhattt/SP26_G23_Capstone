using AGMS.Application.DTOs.MaintenanacePackage;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.ServiceOrder
{
    public class MaintenancePrintDto
    {
        public int MaintenanceId { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string LicensePlate { get; set; } = string.Empty;

        public string? EngineNumber { get; set; }
        public string? ChassisNumber { get; set; }
        public int? Odometer { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime MaintenanceDate { get; set; }
        public List<MaintenanceLineItemDto> LineItems { get; set; } = new();

    }
    public class MaintenanceLineItemDto
    {
        public string SourceType { get; set; }=string.Empty;
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Notes { get; set; }
    }
}
