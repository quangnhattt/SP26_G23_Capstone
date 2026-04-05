using System;

namespace AGMS.Application.DTOs.Inventory
{
    public class InventoryAdjustmentDto
    {
        public int ProductId { get; set; }
        public decimal ActualQuantity { get; set; }
    }
}
