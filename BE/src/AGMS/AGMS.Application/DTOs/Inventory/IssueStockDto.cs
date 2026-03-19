using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Inventory;

public class IssueStockDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public int TransferOrderId { get; set; } // Mã phiếu xuất liên quan

    [Range(0.01, 1000000, ErrorMessage = "Số lượng phải lớn hơn 0")]
    public decimal Quantity { get; set; }

    public string Note { get; set; } = string.Empty;
}