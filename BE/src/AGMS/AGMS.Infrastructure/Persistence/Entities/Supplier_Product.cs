using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Supplier_Product
{
    public int SupplierID { get; set; }

    public int ProductID { get; set; }

    public int? DeliveryDuration { get; set; }

    public decimal? EstimatedPrice { get; set; }

    public string? Policies { get; set; }

    public bool IsActive { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Supplier Supplier { get; set; } = null!;
}
