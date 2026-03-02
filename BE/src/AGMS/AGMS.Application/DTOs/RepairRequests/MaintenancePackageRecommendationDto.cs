namespace AGMS.Application.DTOs.RepairRequests;

public class MaintenancePackageRecommendationDto
{
    public int PackageId { get; set; }
    public string PackageCode { get; set; } = null!;
    public string PackageName { get; set; } = null!;
    public int? KilometerMilestone { get; set; }
    public decimal? EstimatedDurationHours { get; set; }
    public decimal? FinalPrice { get; set; }
}

