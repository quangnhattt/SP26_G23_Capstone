using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO yêu cầu SA điều phối dịch vụ kéo xe (UC-RES-03 C1).
/// Actor: SA — BR-17, BR-18 (PROPOSED_TOWING → TOWING_DISPATCHED). SMC05, SMC11.
/// </summary>
public class DispatchTowingDto
{
    /// <summary>Ghi chú dịch vụ kéo xe (địa điểm, lưu ý). Max 500 ký tự.</summary>
    [MaxLength(500, ErrorMessage = "TowingNotes không được vượt quá 500 ký tự.")]
    public string? TowingNotes { get; set; }

    /// <summary>Dự kiến thời gian kéo xe đến xưởng — phải là thời điểm trong tương lai</summary>
    public DateTime? EstimatedArrival { get; set; }

    /// <summary>Phí dịch vụ kéo xe ước tính (>= 0)</summary>
    [Range(0, double.MaxValue, ErrorMessage = "Phí kéo xe không được âm.")]
    public decimal? TowingServiceFee { get; set; }
}
