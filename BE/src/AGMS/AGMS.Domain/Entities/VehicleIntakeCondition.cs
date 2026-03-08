namespace AGMS.Domain.Entities;

public class VehicleIntakeCondition
{
    public int Id { get; set; }
    public int CarId { get; set; }
    public int MaintenanceID { get; set; }
    public DateTime CheckInTime { get; set; }
    public string? FrontStatus { get; set; }
    public string? RearStatus { get; set; }
    public string? LeftStatus { get; set; }
    public string? RightStatus { get; set; }
    public string? RoofStatus { get; set; }
    public string? ConditionNote { get; set; }

    public virtual Car Car { get; set; } = null!;
    public virtual CarMaintenance Maintenance { get; set; } = null!;
}

