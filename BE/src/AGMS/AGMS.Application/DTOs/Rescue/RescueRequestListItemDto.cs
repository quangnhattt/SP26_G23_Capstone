namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO rút gọn dùng trong danh sách yêu cầu cứu hộ (GET /rescue-requests)
/// </summary>
public class RescueRequestListItemDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public string? RescueType { get; set; }
    public string CurrentAddress { get; set; } = null!;
    public string? ProblemDescription { get; set; }
    public bool RequiresDeposit { get; set; }
    public decimal DepositAmount { get; set; }
    public bool IsDepositPaid { get; set; }
    public DateTime? DepositPaidDate { get; set; }
    public bool IsDepositConfirmed { get; set; }
    public DateTime? DepositConfirmedDate { get; set; }

    // --- Thông tin khách hàng ---
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string? CustomerPhone { get; set; }

    // --- Thông tin xe ---
    public int CarId { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public string Model { get; set; } = null!;

    // --- Thông tin SA (null nếu chưa tiếp nhận) ---
    public int? ServiceAdvisorId { get; set; }
    public string? ServiceAdvisorName { get; set; }

    public DateTime CreatedDate { get; set; }
}
