using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class StockLot
{
    public int LotID { get; set; }

    public int ProductID { get; set; }

    public string LotNumber { get; set; } = null!;

    public DateOnly? ExpiryDate { get; set; }

    public decimal? UnitCost { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual InventoryLotBalance? InventoryLotBalance { get; set; }

    public virtual ICollection<Inventory_Lot> Inventory_Lots { get; set; } = new List<Inventory_Lot>();

    public virtual Product Product { get; set; } = null!;

    public virtual ICollection<ServicePartDetail> ServicePartDetails { get; set; } = new List<ServicePartDetail>();
}
