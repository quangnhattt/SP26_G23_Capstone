using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Một sản phẩm được SA đề xuất sớm ở bước đánh giá rescue.
/// Tên DTO giữ nguyên để không làm vỡ API hiện tại, nhưng Product có thể là SERVICE hoặc PART.
/// </summary>
public class SuggestedRescuePartDto
{
    /// <summary>ID sản phẩm trong bảng Product.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "PartId phải lớn hơn 0.")]
    public int PartId { get; set; }

    /// <summary>Số lượng dự kiến cần dùng cho sản phẩm này.</summary>
    [Range(0.001, double.MaxValue, ErrorMessage = "Quantity phải lớn hơn 0.")]
    public decimal Quantity { get; set; }
}