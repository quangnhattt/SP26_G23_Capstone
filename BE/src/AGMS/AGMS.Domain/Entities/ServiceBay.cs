namespace AGMS.Domain.Entities;

public class ServiceBay
{
    public int BayID { get; set; }
    public string BayName { get; set; } = null!;
    public string? BayType { get; set; }
    public string Status { get; set; } = null!;
    public int? AssignedTechnicianID { get; set; }
    public string? MaintenanceNote { get; set; }
    public bool IsActive { get; set; }

    public virtual User? AssignedTechnician { get; set; }
    public virtual ICollection<CarMaintenance> CarMaintenances { get; set; } = new List<CarMaintenance>();
}
