using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.RepairRequests;

public class RepairRequestCreateRequest
{
    [Required]
    public int CarId { get; set; }

    /// <summary>
    /// Free-form description entered by the customer. This is the only text
    /// field persisted into the Notes column.
    /// </summary>
    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = null!;

    /// <summary>
    /// Appointment type: 'repair' or 'maintenance'. Stored as REPAIR or MAINTENANCE in DB.
    /// REPAIR => RequestedPackageId must be null. MAINTENANCE => RequestedPackageId required.
    /// </summary>
    [Required(ErrorMessage = "ServiceType is required. Use 'repair' or 'maintenance'.")]
    [RegularExpression("^(?i)(repair|maintenance)$", ErrorMessage = "ServiceType must be 'repair' or 'maintenance'.")]
    public string ServiceType { get; set; } = null!;

    /// <summary>
    /// Required when ServiceType is 'maintenance'. Must be null when ServiceType is 'repair'.
    /// </summary>
    public int? RequestedPackageId { get; set; }

    public int? TechnicianId { get; set; }

    [Phone]
    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required]
    public string PreferredDate { get; set; } = null!;

    [Required]
    public string PreferredTime { get; set; } = null!;

    /// <summary>
    /// Danh sách SymptomID mà khách chọn khi đặt lịch.
    /// Lấy từ API /api/symptoms.
    /// </summary>
    public List<int>? SymptomIds { get; set; }
}
