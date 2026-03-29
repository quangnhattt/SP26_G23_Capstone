using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

public class PayRescueDepositDto
{
    [Required(ErrorMessage = "PaymentMethod la bat buoc.")]
    public string PaymentMethod { get; set; } = null!;

    [Required(ErrorMessage = "Amount la bat buoc.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount phai lon hon 0.")]
    public decimal Amount { get; set; }

    [MaxLength(100, ErrorMessage = "TransactionReference khong duoc vuot qua 100 ky tu.")]
    public string? TransactionReference { get; set; }
}
