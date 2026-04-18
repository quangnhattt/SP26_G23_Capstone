namespace AGMS.Domain.Entities;

public class Product
{
    public int ProductID { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public int? UnitID { get; set; }
    public int? CategoryID { get; set; }
    public int WarrantyPeriodMonths { get; set; }
    public int MinStockLevel { get; set; }
    public decimal? EstimatedDurationHours { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }

    public virtual Category? Category { get; set; }
    public virtual ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
    public virtual ICollection<MaintenancePackageDetail> MaintenancePackageDetails { get; set; } = new List<MaintenancePackageDetail>();
    public virtual ProductInventory? ProductInventory { get; set; }
    public virtual ICollection<ServiceDetail> ServiceDetails { get; set; } = new List<ServiceDetail>();
    public virtual ICollection<ServicePartDetail> ServicePartDetails { get; set; } = new List<ServicePartDetail>();
    public virtual ICollection<SupplierProduct> SupplierProducts { get; set; } = new List<SupplierProduct>();
    public virtual ICollection<TransferOrderDetail> TransferOrderDetails { get; set; } = new List<TransferOrderDetail>();
    public virtual Unit? Unit { get; set; }

    public virtual ICollection<SymptomProduct> SymptomProducts { get; set; } = new List<SymptomProduct>();
}
