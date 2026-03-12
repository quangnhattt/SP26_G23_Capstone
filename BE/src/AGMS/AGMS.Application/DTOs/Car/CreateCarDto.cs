namespace AGMS.Application.DTOs.Car;

// Request body cho POST /api/customer/cars
public class CreateCarDto
{
    public string LicensePlate { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? Color { get; set; }
    public string? EngineNumber { get; set; }
    public string? ChassisNumber { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public int CurrentOdometer { get; set; }
}
