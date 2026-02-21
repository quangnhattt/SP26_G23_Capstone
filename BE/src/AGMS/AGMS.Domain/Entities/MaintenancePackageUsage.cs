namespace AGMS.Domain.Entities;

public class MaintenancePackageUsage
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
