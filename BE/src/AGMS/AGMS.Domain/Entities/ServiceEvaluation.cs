namespace AGMS.Domain.Entities;

public class ServiceEvaluation
{
    public int EvaluationID { get; set; }
    public int MaintenanceID { get; set; }
    public int CustomerID { get; set; }
    public int? ServiceRating { get; set; }
    public int? QualityRating { get; set; }
    public int? TimelinessRating { get; set; }
    public int? OverallRating { get; set; }
    public string? Comments { get; set; }
    public DateTime CreatedDate { get; set; }

    public virtual User Customer { get; set; } = null!;
    public virtual CarMaintenance Maintenance { get; set; } = null!;
}
