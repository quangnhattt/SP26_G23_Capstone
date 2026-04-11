namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO chi tiet day du cua yeu cau cuu ho (GET /rescue-requests/{id}).
/// </summary>
public class RescueRequestDetailDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public string? RescueType { get; set; }
    public string CurrentAddress { get; set; } = null!;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? ProblemDescription { get; set; }
    public string? ImageEvidence { get; set; }
    public decimal ServiceFee { get; set; }
    public List<SuggestedRescuePartDetailDto> SuggestedParts { get; set; } = [];
    public IEnumerable<RepairItemResponseDto> RepairItems { get; set; } = [];
    public decimal RepairSubtotal { get; set; }
    public bool RequiresDeposit { get; set; }
    public decimal DepositAmount { get; set; }
    public bool IsDepositPaid { get; set; }
    public DateTime? DepositPaidDate { get; set; }
    public bool IsDepositConfirmed { get; set; }
    public DateTime? DepositConfirmedDate { get; set; }
    public int? DepositConfirmedById { get; set; }
    public DateTime? EstimatedArrivalDateTime { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public int CustomerTrustScore { get; set; }
    public string? MembershipRank { get; set; }

    public int CarId { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? Color { get; set; }

    public int? ServiceAdvisorId { get; set; }
    public string? ServiceAdvisorName { get; set; }

    public int? AssignedTechnicianId { get; set; }
    public string? AssignedTechnicianName { get; set; }
    public string? AssignedTechnicianPhone { get; set; }

    public int? ResultingMaintenanceId { get; set; }
}
