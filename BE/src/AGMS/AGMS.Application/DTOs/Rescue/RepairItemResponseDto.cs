namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO response cho một dòng vật tư/dịch vụ đã ghi nhận (SMC08)
/// </summary>
public class RepairItemResponseDto
{
    public int ServiceDetailId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    /// <summary>TotalPrice = Quantity × UnitPrice (computed column trong DB)</summary>
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO response tổng hợp sau khi ghi nhận vật tư/dịch vụ (UC-RES-02 Step 7, SMC08)
/// </summary>
public class RepairItemsResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;
    public int MaintenanceId { get; set; }
    public IEnumerable<RepairItemResponseDto> RepairItems { get; set; } = [];
    /// <summary>Tổng tiền hiện tại của tất cả vật tư/dịch vụ</summary>
    public decimal Subtotal { get; set; }
}
