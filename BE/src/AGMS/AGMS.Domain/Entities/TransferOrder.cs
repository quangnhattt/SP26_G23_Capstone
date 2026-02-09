namespace AGMS.Domain.Entities;

public class TransferOrder
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
    public virtual ICollection<InventoryLot> InventoryLots { get; set; } = new List<InventoryLot>();
    public virtual CarMaintenance? RelatedMaintenance { get; set; }
    public virtual ICollection<ServicePartDetail> ServicePartDetailIssuedTransferOrders { get; set; } = new List<ServicePartDetail>();
    public virtual ICollection<ServicePartDetail> ServicePartDetailReservedTransferOrders { get; set; } = new List<ServicePartDetail>();
    public virtual Supplier? Supplier { get; set; }
}
