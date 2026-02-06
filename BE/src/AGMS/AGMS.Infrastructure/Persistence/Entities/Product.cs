using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Product
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

    public virtual ICollection<AppointmentServiceItem> AppointmentServiceItems { get; set; } = new List<AppointmentServiceItem>();

    public virtual Category? Category { get; set; }

    public virtual ICollection<MaintenancePackageDetail> MaintenancePackageDetails { get; set; } = new List<MaintenancePackageDetail>();

    public virtual ICollection<ServiceDetail> ServiceDetails { get; set; } = new List<ServiceDetail>();

    public virtual ICollection<ServicePartDetail> ServicePartDetails { get; set; } = new List<ServicePartDetail>();

    public virtual ICollection<StockLot> StockLots { get; set; } = new List<StockLot>();

    public virtual ICollection<Supplier_Product> Supplier_Products { get; set; } = new List<Supplier_Product>();

    public virtual Unit? Unit { get; set; }
}
