using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO Customer chấp nhận dịch vụ kéo xe (UC-RES-03 C2).
/// Actor: Customer — BR-18 (TOWING_DISPATCHED → TOWING_ACCEPTED).
/// AF-01: Customer từ chối → gọi cancel endpoint (UC-RES-06).
/// </summary>
public class AcceptTowingDto
{
    /// <summary>ID khách hàng chấp nhận — validate phải là CustomerID của rescue request này</summary>
    [Required(ErrorMessage = "CustomerId là bắt buộc.")]
    public int CustomerId { get; set; }
}
