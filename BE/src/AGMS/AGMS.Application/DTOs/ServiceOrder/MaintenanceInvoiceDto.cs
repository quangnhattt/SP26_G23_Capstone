using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.ServiceOrder
{
    public class MaintenanceInvoiceDto
    {
        public int MaintenanceId { get; set; }
        public MaintenanceCustomerDto Customer { get; set; } = null!;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? Color { get; set; }

        public string? LicensePlate { get; set; } = string.Empty;
        public string? EngineNumber { get; set; }
        public string? ChassisNumber { get; set; }
        public int? Odometer { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CreatedDate { get; set; }
        public DateTime MaintenanceDate { get; set; }

        public decimal TotalAmount { get; set; }
        public string? MembershipRankApplied { get; set; }
        public decimal MemberDiscountPercent { get; set; }
        public decimal MemberDiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public List<MaintenancePackageUsagePrintDto> PackageUsages { get; set; } = new();
        public List<MaintenanceInvoiceLineItemDto> LineItems { get; set; } = new();
    }
    public class MaintenanceCustomerDto
    {
        public string UserCode { get; set; } = null;
        public string FullName { get; set; } = null;
        public string Email { get; set; } = null;
        public string? Phone { get; set; }
        public string? Gender { get; set; }
        public DateOnly? Dob { get; set; }
        public int? CurrentRankId { get; set; }
        public decimal TotalSpending { get; set; }
    }
    public class MaintenancePackageUsagePrintDto
    {
        public int PackageId { get; set; }
        public string PackageCode { get; set; } = null;
        public string PackageName { get; set; } = null;
        public decimal PackagePrice { get; set; }
        public decimal PackageDiscountAmount { get; set; }
    }
    public class MaintenanceInvoiceLineItemDto
    {
        public string SourceType { get; set; } = string.Empty;
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Notes { get; set; }
        public string? ItemStatus { get; set; }
    }

}
