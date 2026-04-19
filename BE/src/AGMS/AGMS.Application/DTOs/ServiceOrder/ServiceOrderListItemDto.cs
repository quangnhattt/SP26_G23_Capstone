using System;

namespace AGMS.Application.DTOs.ServiceOrder;

public class ServiceOrderListItemDto
{
    public int MaintenanceId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string CarInfo { get; set; } = null!;
    public DateTime MaintenanceDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string MaintenanceType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? TechnicianName { get; set; }
    public string? Notes { get; set; }
}
