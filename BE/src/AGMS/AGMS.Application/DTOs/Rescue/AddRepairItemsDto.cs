using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body ghi nhận vật tư/dịch vụ sử dụng khi sửa ven đường (UC-RES-02 Step 7, BR-20).
/// Mỗi lần gọi THÊM mới các items — không thay thế danh sách cũ.
/// </summary>
public class AddRepairItemsDto
{
    /// <summary>ID người thực hiện (Technician hoặc SA)</summary>
    [Required(ErrorMessage = "ID người thực hiện là bắt buộc.")]
    public int ActorId { get; set; }

    /// <summary>Danh sách vật tư/dịch vụ cần ghi nhận — tối thiểu 1 item</summary>
    [Required]
    [MinLength(1, ErrorMessage = "Phải có ít nhất 1 vật tư/dịch vụ.")]
    public List<RepairItemDto> Items { get; set; } = [];
}

/// <summary>Chi tiết một vật tư hoặc dịch vụ sử dụng trong quá trình sửa chữa</summary>
public class RepairItemDto
{
    /// <summary>ID sản phẩm (phụ tùng hoặc dịch vụ) — phải tồn tại trong hệ thống (BR-20)</summary>
    [Required(ErrorMessage = "ID sản phẩm là bắt buộc.")]
    public int ProductId { get; set; }

    /// <summary>Số lượng sử dụng — phải lớn hơn 0</summary>
    [Required]
    [Range(0.001, double.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0.")]
    public decimal Quantity { get; set; }

    /// <summary>Đơn giá tại thời điểm sử dụng</summary>
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Đơn giá phải >= 0.")]
    public decimal UnitPrice { get; set; }

    /// <summary>Ghi chú cho vật tư/dịch vụ này (tùy chọn)</summary>
    [MaxLength(255)]
    public string? Notes { get; set; }
}
