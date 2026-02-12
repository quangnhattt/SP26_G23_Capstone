namespace AGMS.Application.DTOs.Product;

public class PartProductListItemDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string? Unit { get; set; }
    public string? Category { get; set; }
    public int Warranty { get; set; }
    public int MinStockLevel { get; set; }
    public int StockQty { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public bool IsActive { get; set; }
}
