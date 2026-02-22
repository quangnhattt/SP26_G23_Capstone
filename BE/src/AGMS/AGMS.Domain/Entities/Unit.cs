namespace AGMS.Domain.Entities;

public class Unit
{
    public int UnitID { get; set; }
    public string Name { get; set; } = null!;
    public string? Type { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true; 
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
