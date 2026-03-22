using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Request body khi khách hàng tạo yêu cầu cứu hộ (UC-RES-01 Step 1)
/// </summary>
public class CreateRescueRequestDto
{
    /// <summary>ID xe cần cứu hộ — phải thuộc sở hữu của CustomerId</summary>
    [Required(ErrorMessage = "ID xe là bắt buộc.")]
    public int CarId { get; set; }

    /// <summary>Địa chỉ hiện tại của xe — bắt buộc theo BR-16</summary>
    [Required(ErrorMessage = "Địa chỉ xe là bắt buộc.")]
    [MaxLength(500)]
    public string CurrentAddress { get; set; } = null!;

    /// <summary>Mô tả sự cố xe đang gặp phải — bắt buộc theo BR-16</summary>
    [Required(ErrorMessage = "Mô tả sự cố là bắt buộc.")]
    [MaxLength(1000)]
    public string ProblemDescription { get; set; } = null!;

    /// <summary>Vĩ độ GPS vị trí xe (tùy chọn)</summary>
    [Range(-90, 90, ErrorMessage = "Vĩ độ phải trong khoảng -90 đến 90.")]
    public decimal? Latitude { get; set; }

    /// <summary>Kinh độ GPS vị trí xe (tùy chọn)</summary>
    [Range(-180, 180, ErrorMessage = "Kinh độ phải trong khoảng -180 đến 180.")]
    public decimal? Longitude { get; set; }

    /// <summary>URL ảnh minh chứng sự cố (tùy chọn)</summary>
    [MaxLength(500)]
    public string? ImageEvidence { get; set; }

    /// <summary>Phone</summary>
    [Required(ErrorMessage = "Số điện thoại bắt buộc phải nhập")]
    [MaxLength(15)]
    public string Phone { get; set; } = null!;
}
