using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Một phụ tùng được đề xuất sớm ở bước đánh giá rescue.
/// </summary>
public class SuggestedRescuePartDto
{
    /// <summary>ID phụ tùng trong bảng Product.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "PartId phải lớn hơn 0.")]
    public int PartId { get; set; }

    /// <summary>Số lượng dự kiến cần dùng cho phụ tùng này.</summary>
    [Range(0.001, double.MaxValue, ErrorMessage = "Quantity phải lớn hơn 0.")]
    public decimal Quantity { get; set; }
}
