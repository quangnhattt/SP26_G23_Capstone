namespace AGMS.Domain.Entities;

public class ProductInventory
{
    public int ProductID { get; set; }
    public decimal Quantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public DateTime LastUpdated { get; set; }

    public virtual Product Product { get; set; } = null!;
}
