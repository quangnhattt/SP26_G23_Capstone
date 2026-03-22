using System;

namespace AGMS.Application.DTOs.Inventory
{
    public class InventoryTransactionFilterDto
    {
        public int? ProductId { get; set; }
        public string? TransactionType { get; set; } 
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}