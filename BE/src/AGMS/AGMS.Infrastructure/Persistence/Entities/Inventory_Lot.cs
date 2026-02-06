using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Inventory_Lot
{
    public int TransferOrderID { get; set; }

    public int LotID { get; set; }

    public int Quantity_Doc { get; set; }

    public int? Quantity_Act { get; set; }

    public decimal? Price { get; set; }

    public string Status { get; set; } = null!;

    public virtual StockLot Lot { get; set; } = null!;

    public virtual Transfer_Order TransferOrder { get; set; } = null!;
}
