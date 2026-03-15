namespace AGMS.Application.DTOs.RepairRequests;

public class RepairRequestDetailDto
{
    public int AppointmentId { get; set; }
    public int CarId { get; set; }
    public int CreatedByUserId { get; set; }
    public string? Phone { get; set; }
    public string Description { get; set; } = null!;
    public string ServiceType { get; set; } = null!;
    public int? RequestedPackageId { get; set; }
    public int? TechnicianId { get; set; }
    public string PreferredDate { get; set; } = null!;
    public string PreferredTime { get; set; } = null!;
    public DateTime CreatedDateUtc { get; set; }
    public string Status { get; set; } = null!;
}
