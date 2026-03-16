namespace AGMS.Application.DTOs.Supplier
{
    // DTO dùng để hiển thị danh sách SP của 1 NCC
    public class SupplierProductResponseDto
    {
        public int ProductID { get; set; }
        public string ProductCode { get; set; } = null!;
        public string ProductName { get; set; } = null!;
        public int? DeliveryDuration { get; set; } // Ngày giao
        public decimal? EstimatedPrice { get; set; } // Giá báo
        public string? Policies { get; set; } // Chính sách (VD: Bảo hành 1 đổi 1)
        public bool IsActive { get; set; }
    }

    // DTO dùng để Thêm mới hoặc Cập nhật (Upsert)
    public class SupplierProductUpsertDto
    {
        public int ProductID { get; set; }
        public int? DeliveryDuration { get; set; }
        public decimal? EstimatedPrice { get; set; }
        public string? Policies { get; set; }
        public bool IsActive { get; set; } = true;
    }

    // DTO dùng khi NCC có 1 sản phẩm hoàn toàn mới chưa từng có trong Gara
    public class SupplierNewProductRequestDto
    {
        // Thông tin để tạo Product mới
        public string ProductCode { get; set; } = null!;
        public string ProductName { get; set; } = null!;
        public decimal Price { get; set; } // Giá bán ra dự kiến của Gara
        public string? Description { get; set; }
        public int WarrantyPeriodMonths { get; set; }
        public int MinStockLevel { get; set; }
        public int? CategoryID { get; set; }
        public int? UnitID { get; set; }

        // Thông tin để liên kết Supplier_Product
        public int? DeliveryDuration { get; set; }
        public decimal? EstimatedPrice { get; set; } // Giá nhập vào từ NCC
        public string? Policies { get; set; }
    }
}