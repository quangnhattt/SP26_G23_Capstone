namespace AGMS.Application.DTOs.Car;

// Response trả về sau khi Add/Update hoặc Get detail
public class CarDetailDto
{
    public int CarId { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? Color { get; set; }
    public string? EngineNumber { get; set; }
    public string? ChassisNumber { get; set; }
    public int OwnerID { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? LastMaintenanceDate { get; set; }
    public DateOnly? NextMaintenanceDate { get; set; }
    public int CurrentOdometer { get; set; }
    public DateTime CreatedDate { get; set; }
}
