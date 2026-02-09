namespace AGMS.Domain.Entities;

public class InventoryLotBalance
{
    public int LotID { get; set; }
    public int OnHandQty { get; set; }
    public int ReservedQty { get; set; }
    public DateTime LastUpdated { get; set; }

    public virtual StockLot Lot { get; set; } = null!;
}
