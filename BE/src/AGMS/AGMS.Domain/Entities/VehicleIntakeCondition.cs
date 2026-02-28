namespace AGMS.Domain.Entities;

public class VehicleIntakeCondition
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public int? AppointmentId { get; set; }
    public DateTime CheckInTime { get; set; }
    public string PositionCode { get; set; } = null!;
    public string ConditionType { get; set; } = null!;
    public string? Note { get; set; }

    public virtual Car Car { get; set; } = null!;
    public virtual Appointment? Appointment { get; set; }
}

