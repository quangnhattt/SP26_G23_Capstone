namespace AGMS.Application.DTOs.RepairRequests;

public class CustomerCarListItemDto
{
    public int CarId { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? Color { get; set; }
    public int CurrentOdometer { get; set; }
    public DateOnly? LastMaintenanceDate { get; set; }
    public DateOnly? NextMaintenanceDate { get; set; }
}

