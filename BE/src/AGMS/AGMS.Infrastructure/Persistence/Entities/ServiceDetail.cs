using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class ServiceDetail
{
    public int ServiceDetailID { get; set; }

    public int MaintenanceID { get; set; }

    public int ProductID { get; set; }

    public decimal Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal? TotalPrice { get; set; }

    public string ItemStatus { get; set; } = null!;

    public bool IsAdditional { get; set; }

    public bool FromPackage { get; set; }

    public int? PackageID { get; set; }

    public string? Notes { get; set; }

    public virtual CarMaintenance Maintenance { get; set; } = null!;

    public virtual MaintenancePackage? Package { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual ICollection<WarrantyClaim> WarrantyClaims { get; set; } = new List<WarrantyClaim>();
}
