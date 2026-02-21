namespace AGMS.Domain.Entities;

public class MaintenancePackage
{
    public int PackageID { get; set; }
    public string PackageCode { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int? KilometerMilestone { get; set; }
    public int? MonthMilestone { get; set; }
    public decimal BasePrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal? FinalPrice { get; set; }
    public decimal? EstimatedDurationHours { get; set; }
    public string? ApplicableBrands { get; set; }
    public string? Image { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? CreatedBy { get; set; }

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public virtual User? CreatedByNavigation { get; set; }
    public virtual ICollection<MaintenancePackageDetail> MaintenancePackageDetails { get; set; } = new List<MaintenancePackageDetail>();
    public virtual ICollection<MaintenancePackageUsage> MaintenancePackageUsages { get; set; } = new List<MaintenancePackageUsage>();
    public virtual ICollection<ServiceDetail> ServiceDetails { get; set; } = new List<ServiceDetail>();
    public virtual ICollection<ServicePartDetail> ServicePartDetails { get; set; } = new List<ServicePartDetail>();
}
