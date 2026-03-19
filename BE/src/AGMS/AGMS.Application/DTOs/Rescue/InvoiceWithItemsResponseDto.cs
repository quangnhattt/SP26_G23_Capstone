namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi GET hóa đơn (UC-RES-04 D2).
/// Bao gồm chi tiết hóa đơn + danh sách vật tư/dịch vụ từ Repair Order (BR-20).
/// </summary>
public class InvoiceWithItemsResponseDto
{
    public int RescueId { get; set; }

    /// <summary>Thông tin hóa đơn — null nếu hóa đơn chưa được tạo</summary>
    public InvoiceDetailDto? Invoice { get; set; }

    /// <summary>Danh sách vật tư/dịch vụ đã ghi nhận (BR-20). Rỗng nếu là rescue kéo xe.</summary>
    public IEnumerable<RepairItemResponseDto> RepairItems { get; set; } = [];
}
