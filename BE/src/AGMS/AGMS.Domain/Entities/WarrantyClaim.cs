namespace AGMS.Domain.Entities;

public class WarrantyClaim
{
    public int ClaimID { get; set; }
    public int CarID { get; set; }
    public int OriginalMaintenanceID { get; set; }
    public int? OriginalServiceDetailID { get; set; }
    public int? OriginalServicePartDetailID { get; set; }
    public string CustomerDescription { get; set; } = null!;
    public DateTime ClaimDate { get; set; }
    public string Status { get; set; } = null!;
    public string? AdvisorNotes { get; set; }
    public string? RejectionReason { get; set; }
    public int? AdvisorID { get; set; }
    public int? ResultingMaintenanceID { get; set; }

    public virtual User? Advisor { get; set; }
    public virtual Car Car { get; set; } = null!;
    public virtual CarMaintenance OriginalMaintenance { get; set; } = null!;
    public virtual ServiceDetail? OriginalServiceDetail { get; set; }
    public virtual ServicePartDetail? OriginalServicePartDetail { get; set; }
    public virtual CarMaintenance? ResultingMaintenance { get; set; }
}
