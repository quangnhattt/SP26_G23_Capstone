using System;

namespace AGMS.Application.DTOs.Inventory
{
    public class InventoryTransactionHistoryDto
    {
        public int TransactionID { get; set; }
        public int ProductID { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public int ReferenceID { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal Balance { get; set; }
        public decimal UnitCost { get; set; }
        public DateTime TransactionDate { get; set; }
        public string? Note { get; set; }
    }

    public class PaginatedResult<T>
    {
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public List<T> Items { get; set; } = new List<T>();
    }
}