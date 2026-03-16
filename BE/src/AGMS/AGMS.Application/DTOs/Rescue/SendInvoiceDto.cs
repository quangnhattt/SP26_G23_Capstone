using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO SA gửi hóa đơn cho Customer (UC-RES-04 D3).
/// Actor: SA — BR-25 (bảo mật tài chính qua HTTPS). SMC05.
/// Status transition: INVOICED → INVOICE_SENT.
/// </summary>
public class SendInvoiceDto
{
    /// <summary>ID SA gửi hóa đơn — validate BR-17</summary>
    [Required(ErrorMessage = "ServiceAdvisorId là bắt buộc.")]
    public int ServiceAdvisorId { get; set; }
}
