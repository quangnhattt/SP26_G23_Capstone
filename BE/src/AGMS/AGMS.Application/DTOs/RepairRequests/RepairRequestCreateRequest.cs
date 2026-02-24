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

    [Required]
    [MinLength(1)]
    public List<int> ServiceIds { get; set; } = new();

    public int? TechnicianId { get; set; }

    /// <summary>
    /// Preferred date in ISO format (yyyy-MM-dd).
    /// </summary>
    [Required]
    public string PreferredDate { get; set; } = null!;

    /// <summary>
    /// Preferred time, e.g. HH:mm.
    /// </summary>
    [Required]
    public string PreferredTime { get; set; } = null!;

    /// <summary>
    /// Optional serviceType hint, e.g. "maintenance" to trigger maintenance-by-km logic.
    /// </summary>
    public string? ServiceType { get; set; }
}

