namespace AGMS.Application.DTOs.RepairRequests;

public class TechnicianListItemDto
{
    public int TechnicianId { get; set; }
    public string FullName { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Skills { get; set; }
}

