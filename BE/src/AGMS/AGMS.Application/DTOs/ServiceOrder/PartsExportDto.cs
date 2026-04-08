using System;
using System.Collections.Generic;

namespace AGMS.Application.DTOs.ServiceOrder
{
    public class PartsExportListDto
    {
        public int MaintenanceID { get; set; }
        public string CustomerName { get; set; } = null!;
        public string LicensePlate { get; set; } = null!;
        public string Model { get; set; } = null!;
        public List<PartsExportItemDto> Items { get; set; } = new List<PartsExportItemDto>();
    }

    public class PartsExportItemDto
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; } = null!;
        public string ProductName { get; set; } = null!;
        public int Quantity { get; set; }
        public string UnitName { get; set; } = null!;
        public string ItemStatus { get; set; } = null!;
        public string InventoryStatus { get; set; } = null!;
        public string? Notes { get; set; }
        public bool FromPackage { get; set; }
    }
}
