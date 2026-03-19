namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO phản hồi sau khi SA xử lý tranh chấp hóa đơn (UC-RES-05 E2). BR-26.
/// Status trở về INVOICE_SENT; invoice được cập nhật (nếu reissue=true) hoặc giữ nguyên.
/// </summary>
public class ResolveDisputeResultDto
{
    public int RescueId { get; set; }
    public string Status { get; set; } = null!;

    /// <summary>Hóa đơn sau khi xử lý tranh chấp (có thể được phát hành lại hoặc giữ nguyên)</summary>
    public ResolvedInvoiceDto Invoice { get; set; } = null!;
}

/// <summary>
/// Chi tiết hóa đơn sau khi resolve tranh chấp — kế thừa InvoiceDetailDto
/// và bổ sung trường UC-RES-05 specific: IsReissued, ResolutionNotes.
/// </summary>
public class ResolvedInvoiceDto : InvoiceDetailDto
{
    /// <summary>true nếu SA phát hành hóa đơn mới với giá điều chỉnh; false nếu giữ nguyên</summary>
    public bool IsReissued { get; set; }

    /// <summary>Ghi chú kết quả xử lý tranh chấp từ SA (BR-26)</summary>
    public string? ResolutionNotes { get; set; }
}
