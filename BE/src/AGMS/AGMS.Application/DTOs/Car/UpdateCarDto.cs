namespace AGMS.Application.DTOs.Car;

// Request body cho PUT /api/customer/cars/{id} — không cho đổi LicensePlate
public class UpdateCarDto
{
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? Color { get; set; }
    public string? EngineNumber { get; set; }
    public string? ChassisNumber { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public int CurrentOdometer { get; set; }
}
