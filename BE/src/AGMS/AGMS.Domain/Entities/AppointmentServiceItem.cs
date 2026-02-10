namespace AGMS.Domain.Entities;

public class AppointmentServiceItem
{
    public int AppointmentID { get; set; }
    public int ProductID { get; set; }
    public decimal Quantity { get; set; }
    public string? Notes { get; set; }

    public virtual Appointment Appointment { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}
