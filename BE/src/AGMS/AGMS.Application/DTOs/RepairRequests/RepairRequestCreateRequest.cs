using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.RepairRequests;

public class RepairRequestCreateRequest
{
    [Required]
    public int CarId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = null!;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = null!;

    public List<string> Symptoms { get; set; } = new();

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

    [Required]
    public string PreferredDate { get; set; } = null!;

    [Required]
    public string PreferredTime { get; set; } = null!;
}
