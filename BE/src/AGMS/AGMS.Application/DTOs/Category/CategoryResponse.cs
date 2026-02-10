namespace AGMS.Application.DTOs.Category;

public class CategoryResponse
{
    public int CategoryID { get; set; }
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string? Description { get; set; }
}
