namespace AGMS.Domain.Entities;

public class PaymentTransaction
{
    public int TransactionID { get; set; }
    public int MaintenanceID { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string Status { get; set; } = null!;
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }
    public int? ProcessedBy { get; set; }

    public virtual CarMaintenance Maintenance { get; set; } = null!;
    public virtual User? ProcessedByNavigation { get; set; }
}
