using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Transfer_Order
{
    public int TransferOrderID { get; set; }

    public string Type { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? Note { get; set; }

    public DateTime DocumentDate { get; set; }

    public int? ApprovedBy { get; set; }

    public int CreateBy { get; set; }

    public DateTime CreatedDate { get; set; }

    public int? RelatedMaintenanceID { get; set; }

    public int? SupplierID { get; set; }

    public virtual User? ApprovedByNavigation { get; set; }

    public virtual User CreateByNavigation { get; set; } = null!;

    public virtual ICollection<Inventory_Lot> Inventory_Lots { get; set; } = new List<Inventory_Lot>();

    public virtual CarMaintenance? RelatedMaintenance { get; set; }

    public virtual ICollection<ServicePartDetail> ServicePartDetailIssuedTransferOrders { get; set; } = new List<ServicePartDetail>();

    public virtual ICollection<ServicePartDetail> ServicePartDetailReservedTransferOrders { get; set; } = new List<ServicePartDetail>();

    public virtual Supplier? Supplier { get; set; }
}
