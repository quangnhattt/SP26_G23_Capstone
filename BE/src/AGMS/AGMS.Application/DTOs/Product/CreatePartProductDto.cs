namespace AGMS.Application.DTOs.Product;

public class CreatePartProductDto
{
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public int? UnitId { get; set; }
    public int? CategoryId { get; set; }
    public int Warranty { get; set; }
    public int MinStockLevel { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public bool IsActive { get; set; } = true;
}
