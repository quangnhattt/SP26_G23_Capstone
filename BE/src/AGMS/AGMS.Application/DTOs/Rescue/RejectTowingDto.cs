using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO khách hàng hủy kéo xe sau khi xe kéo đã tới điểm hẹn.
/// </summary>
public class RejectTowingDto
{
    /// <summary>Lý do hủy kéo xe, dùng cho audit log. Tối đa 500 ký tự.</summary>
    [MaxLength(500, ErrorMessage = "Reason không được vượt quá 500 ký tự.")]
    public string? Reason { get; set; }
}
