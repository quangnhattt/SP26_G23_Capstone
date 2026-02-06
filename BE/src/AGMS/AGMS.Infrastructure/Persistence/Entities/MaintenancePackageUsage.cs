using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class MaintenancePackageUsage
{
    public int UsageID { get; set; }

    public int MaintenanceID { get; set; }

    public int PackageID { get; set; }

    public decimal AppliedPrice { get; set; }

    public decimal DiscountAmount { get; set; }

    public DateTime AppliedDate { get; set; }

    public virtual CarMaintenance Maintenance { get; set; } = null!;

    public virtual MaintenancePackage Package { get; set; } = null!;
}
