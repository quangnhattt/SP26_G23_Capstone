namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi SA tạo hóa đơn (UC-RES-04 D1). SMP02, SMP06.
/// </summary>
public class CreateInvoiceResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;

    /// <summary>Chi tiết hóa đơn vừa được tạo</summary>
    public InvoiceDetailDto Invoice { get; set; } = null!;
}
