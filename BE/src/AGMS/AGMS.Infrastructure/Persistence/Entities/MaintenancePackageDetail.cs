using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class MaintenancePackageDetail
{
    public int PackageDetailID { get; set; }

    public int PackageID { get; set; }

    public int ProductID { get; set; }

    public decimal Quantity { get; set; }

    public bool IsRequired { get; set; }

    public int DisplayOrder { get; set; }

    public string? Notes { get; set; }

    public virtual MaintenancePackage Package { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
