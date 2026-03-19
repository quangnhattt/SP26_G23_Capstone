namespace AGMS.Domain.Entities;

public class InventoryTransaction
{
    public int TransactionID { get; set; }
    public int ProductID { get; set; }
    public int ReferenceID { get; set; }
    public string TransactionType { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal Balance { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? Note { get; set; }
    public decimal UnitCost { get; set; }
    public virtual Product Product { get; set; } = null!;
    public virtual TransferOrder Reference { get; set; } = null!;
}