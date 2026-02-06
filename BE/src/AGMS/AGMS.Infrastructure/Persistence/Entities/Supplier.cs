using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Supplier
{
    public int SupplierID { get; set; }

    public string Name { get; set; } = null!;

    public string? Address { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual ICollection<Supplier_Product> Supplier_Products { get; set; } = new List<Supplier_Product>();

    public virtual ICollection<Transfer_Order> Transfer_Orders { get; set; } = new List<Transfer_Order>();
}
