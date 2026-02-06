using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class ServicePartDetail
{
    public int ServicePartDetailID { get; set; }

    public int MaintenanceID { get; set; }

    public int ProductID { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal? TotalPrice { get; set; }

    public string ItemStatus { get; set; } = null!;

    public bool IsAdditional { get; set; }

    public string InventoryStatus { get; set; } = null!;

    public int IssuedQuantity { get; set; }

    public int? ReservedTransferOrderID { get; set; }

    public int? IssuedTransferOrderID { get; set; }

    public int? LotID { get; set; }

    public DateOnly? InstallationDate { get; set; }

    public DateOnly? WarrantyExpireDate { get; set; }

    public bool FromPackage { get; set; }

    public int? PackageID { get; set; }

    public string? Notes { get; set; }

    public virtual Transfer_Order? IssuedTransferOrder { get; set; }

    public virtual StockLot? Lot { get; set; }

    public virtual CarMaintenance Maintenance { get; set; } = null!;

    public virtual MaintenancePackage? Package { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Transfer_Order? ReservedTransferOrder { get; set; }

    public virtual ICollection<WarrantyClaim> WarrantyClaims { get; set; } = new List<WarrantyClaim>();
}
