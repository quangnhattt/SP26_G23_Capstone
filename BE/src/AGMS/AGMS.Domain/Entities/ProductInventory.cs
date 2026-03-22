using System;
using System.ComponentModel.DataAnnotations; // Cần cho [Timestamp]

namespace AGMS.Domain.Entities;

public class ProductInventory
{
    public int ProductID { get; set; }
    public decimal Quantity { get; set; }
    public DateTime LastUpdated { get; set; }
    public decimal AverageCost { get; set; }
    [Timestamp]
    public byte[] RowVersion { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}