using System;

namespace AGMS.Application.DTOs.Inventory
{
    public class InventoryDashboardDto
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; } = null!;
        public string ProductName { get; set; } = null!;
        public string? CategoryName { get; set; }

        // Dữ liệu tồn kho
        public decimal Quantity { get; set; }
        public decimal ReservedQuantity { get; set; }
        public decimal AvailableQuantity { get; set; } // Số lượng thực tế có thể dùng/bán
        public int MinStockLevel { get; set; }

        // Cờ cảnh báo cho Frontend tô màu đỏ
        public bool IsLowStock { get; set; }
    }
}