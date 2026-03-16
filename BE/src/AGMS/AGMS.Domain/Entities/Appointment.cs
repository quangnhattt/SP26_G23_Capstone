namespace AGMS.Domain.Entities;

public class Appointment
{
    public int AppointmentID { get; set; }
    public int CarID { get; set; }
    public DateTime AppointmentDate { get; set; }
    public int? RequestedPackageID { get; set; }
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? ConfirmedBy { get; set; }
    public DateTime? ConfirmedDate { get; set; }

    /// <summary>
    /// Appointment classification: REPAIR or MAINTENANCE. DB CHECK: ServiceType IN ('REPAIR','MAINTENANCE').
    /// </summary>
    public string ServiceType { get; set; } = "REPAIR";

    public virtual Car Car { get; set; } = null!;
    public virtual ICollection<CarMaintenance> CarMaintenances { get; set; } = new List<CarMaintenance>();
    public virtual User? ConfirmedByNavigation { get; set; }
    public virtual User CreatedByNavigation { get; set; } = null!;
    public virtual MaintenancePackage? RequestedPackage { get; set; }

    public virtual ICollection<AppointmentSymptom> AppointmentSymptoms { get; set; } = new List<AppointmentSymptom>();
}
