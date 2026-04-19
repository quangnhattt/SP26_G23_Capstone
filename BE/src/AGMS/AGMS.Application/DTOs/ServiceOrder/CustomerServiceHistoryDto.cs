namespace AGMS.Application.DTOs.ServiceOrder;

public class CustomerServiceHistoryDto
{
    public int MaintenanceId { get; set; }
    public DateTime? FinishedDate { get; set; } // Ngày hoàn thành sửa chữa (CompletedDate)
    public string LicensePlate { get; set; } = string.Empty;
    public string MaintenanceType { get; set; } = string.Empty; // MAINTENANCE hoặc REPAIR
    public decimal FinalAmount { get; set; } // Tổng tiền phải trả sau khi giảm giá
    public string Status { get; set; } = string.Empty; // Thường là "CLOSED"
}
