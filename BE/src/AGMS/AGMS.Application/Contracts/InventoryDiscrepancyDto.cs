using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    // DTO dùng để báo cáo sai lệch kho nếu có
    public class InventoryDiscrepancyDto
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; } = null!;
        public decimal SnapshotQuantity { get; set; } // Tồn kho ở bảng ProductInventory
        public decimal LedgerQuantity { get; set; }   // Tổng lịch sử ở bảng InventoryTransaction
        public decimal Difference => SnapshotQuantity - LedgerQuantity;
    }
}
