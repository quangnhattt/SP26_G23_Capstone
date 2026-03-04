namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO chi tiết đầy đủ của yêu cầu cứu hộ (GET /rescue-requests/{id})
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
    public DateTime? EstimatedArrivalDateTime { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    // --- Thông tin khách hàng ---
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    /// <summary>Tên hạng thành viên hiện tại (BR-24)</summary>
    public string? MembershipRank { get; set; }

    // --- Thông tin xe ---
    public int CarId { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;
    public int Year { get; set; }
    public string? Color { get; set; }

    // --- Thông tin Service Advisor ---
    public int? ServiceAdvisorId { get; set; }
    public string? ServiceAdvisorName { get; set; }

    // --- Thông tin kỹ thuật viên được assign ---
    public int? AssignedTechnicianId { get; set; }
    public string? AssignedTechnicianName { get; set; }
    public string? AssignedTechnicianPhone { get; set; }

    /// <summary>ID Repair Order được tạo khi kéo xe hoặc sửa ven đường (BR-19)</summary>
    public int? ResultingMaintenanceId { get; set; }
}
