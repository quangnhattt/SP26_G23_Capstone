using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Inventory;

// 1. Cục thông tin chung của Phiếu Nhập
public class CreateGoodsReceiptDto
{
    public int? SupplierId { get; set; } // Nhập từ Nhà cung cấp nào (có thể null nếu nhập tồn đầu kỳ)
    public string Note { get; set; } = string.Empty;

    [Required]
    [MinLength(1, ErrorMessage = "Phải có ít nhất 1 mặt hàng để nhập kho.")]
    public List<GoodsReceiptDetailDto> Items { get; set; } = new();
}

// 2. Cục chi tiết từng món hàng trong phiếu
public class GoodsReceiptDetailDto
{
    [Required]
    public int ProductId { get; set; }

    [Range(0.01, 1000000, ErrorMessage = "Số lượng phải lớn hơn 0")]
    public decimal Quantity { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Giá nhập không hợp lệ")]
    public decimal UnitPrice { get; set; }

    public string Note { get; set; } = string.Empty;
}