using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.ServiceOrder;

public class ProcessPaymentRequestDto
{
    [Required]
    [RegularExpression("^(ONLINE|TRANSFER|CARD|CASH)$", ErrorMessage = "Payment method must be ONLINE, TRANSFER, CARD, or CASH.")]
    public string PaymentMethod { get; set; } = null!;
    
    public string? TransactionReference { get; set; }
    
    public string? Notes { get; set; }
}
