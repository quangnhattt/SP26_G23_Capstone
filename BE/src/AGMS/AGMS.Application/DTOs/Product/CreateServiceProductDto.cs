namespace AGMS.Application.DTOs.Product;

public class CreateServiceProductDto
{
    public string? Code { get; set; }
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public int? UnitId { get; set; }
    public int? CategoryId { get; set; }
    public decimal? EstimatedDurationHours { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public bool IsActive { get; set; } = true;
}
