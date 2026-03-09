namespace AGMS.Domain.Entities;

public class TransferOrderDetail
{
    public int OrderDetailID { get; set; }
    public int TransferOrderID { get; set; }
    public int ProductID { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public string? Notes { get; set; }

    public virtual Product Product { get; set; } = null!;
    public virtual TransferOrder TransferOrder { get; set; } = null!;
}
