namespace AGMS.Application.DTOs.RepairRequests;

public class RepairRequestDetailDto
{
    public int AppointmentId { get; set; }
    public int CarId { get; set; }
    public int CreatedByUserId { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public List<string> Symptoms { get; set; } = new();
    public List<int> ServiceIds { get; set; } = new();
    public int? TechnicianId { get; set; }
    public string PreferredDate { get; set; } = null!;
    public string PreferredTime { get; set; } = null!;
    public DateTime CreatedDateUtc { get; set; }
    public string Status { get; set; } = null!;
}

