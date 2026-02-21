namespace AGMS.Domain.Entities;

public class Car
{
    public int CarID { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? Color { get; set; }
    public string? EngineNumber { get; set; }
    public string? ChassisNumber { get; set; }
    public int OwnerID { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? LastMaintenanceDate { get; set; }
    public DateOnly? NextMaintenanceDate { get; set; }
    public int CurrentOdometer { get; set; }
    public DateTime CreatedDate { get; set; }

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public virtual ICollection<CarMaintenance> CarMaintenances { get; set; } = new List<CarMaintenance>();
    public virtual User Owner { get; set; } = null!;
    public virtual ICollection<RescueRequest> RescueRequests { get; set; } = new List<RescueRequest>();
    public virtual ICollection<WarrantyClaim> WarrantyClaims { get; set; } = new List<WarrantyClaim>();
}
