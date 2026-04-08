namespace AGMS.Application.DTOs.Inventory
{
    // ============================================================
    // DTO dùng cho API 1: Technician xem phiếu xuất kho của mình
    // Lọc theo AssignedTechnicianID trên đơn sửa chữa (CarMaintenance)
    // ============================================================
    public class MyTransferOrderDto
    {
        public int TransferOrderID { get; set; }
        public string Status { get; set; } = string.Empty;          // "DRAFT" / "APPROVED"
        public string? Note { get; set; }
        public DateTime DocumentDate { get; set; }
        public DateTime CreatedDate { get; set; }

        // Thông tin đơn sửa chữa liên quan
        public int? MaintenanceID { get; set; }
        public string MaintenanceStatus { get; set; } = string.Empty;

        // Thông tin xe
        public string? CarLicensePlate { get; set; }
        public string? CarModel { get; set; }
        public string? CarBrand { get; set; }

        // Danh sách chi tiết linh kiện (tech cần biết xuất cái gì)
        public int ItemCount { get; set; }                          // Tổng số dòng (tiện hiển thị badge)
        public List<TransferOrderDetailItemDto> Details { get; set; } = new List<TransferOrderDetailItemDto>();
    }

    // ============================================================
    // DTO dùng cho API 2: Admin/SA xem toàn bộ Transfer Order
    // Bao gồm cả chi tiết linh kiện (TransferOrderDetail)
    // ============================================================
    public class TransferOrderWithDetailsDto
    {
        public int TransferOrderID { get; set; }
        public string Type { get; set; } = string.Empty;            // "ISSUE" / "GOODS_RECEIPT" / "ADJUST"
        public string Status { get; set; } = string.Empty;          // "DRAFT" / "APPROVED"
        public string? Note { get; set; }
        public DateTime DocumentDate { get; set; }
        public DateTime CreatedDate { get; set; }

        // Người tạo phiếu
        public int CreateByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;

        // Người duyệt (nếu đã APPROVED)
        public int? ApprovedByUserId { get; set; }
        public string? ApprovedByName { get; set; }

        // Thông tin đơn sửa chữa liên quan (nếu là phiếu ISSUE)
        public int? MaintenanceID { get; set; }
        public string? MaintenanceStatus { get; set; }

        // Thông tin kỹ thuật viên được phân công
        public int? TechnicianID { get; set; }
        public string? TechnicianName { get; set; }

        // Thông tin xe
        public string? CarLicensePlate { get; set; }
        public string? CarModel { get; set; }

        // Danh sách chi tiết linh kiện
        public List<TransferOrderDetailItemDto> Details { get; set; } = new List<TransferOrderDetailItemDto>();
    }

    // ============================================================
    // DTO một dòng chi tiết linh kiện trong phiếu xuất kho
    // ============================================================
    public class TransferOrderDetailItemDto
    {
        public int OrderDetailID { get; set; }
        public int ProductID { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalLineValue => UnitPrice.HasValue ? Quantity * UnitPrice.Value : null;
    public string? InventoryStatus { get; set; }
        public string? Notes { get; set; }
    }

    // ============================================================
    // Filter DTO cho API 2 (Admin xem toàn bộ Transfer Order)
    // ============================================================
    public class TransferOrderFilterDto
    {
        public string? Type { get; set; }           // "ISSUE", "GOODS_RECEIPT", "ADJUST"
        public string? Status { get; set; }         // "DRAFT", "APPROVED"
        public int? MaintenanceId { get; set; }     // Lọc theo đơn sửa chữa cụ thể
        public int? TechnicianId { get; set; }      // Lọc theo kỹ thuật viên
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
