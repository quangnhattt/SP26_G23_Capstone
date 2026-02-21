namespace AGMS.Domain.Entities;

public class InventoryLot
{
    public int TransferOrderID { get; set; }
    public int LotID { get; set; }
    public int Quantity_Doc { get; set; }
    public int? Quantity_Act { get; set; }
    public decimal? Price { get; set; }
    public string Status { get; set; } = null!;

    public virtual StockLot Lot { get; set; } = null!;
    public virtual TransferOrder TransferOrder { get; set; } = null!;
}
