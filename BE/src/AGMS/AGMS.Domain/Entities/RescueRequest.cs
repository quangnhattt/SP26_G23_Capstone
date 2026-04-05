namespace AGMS.Domain.Entities;

public class RescueRequest
{
    public int RescueID { get; set; }
    public int CarID { get; set; }
    public int CustomerID { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string CurrentAddress { get; set; } = null!;
    public string? ProblemDescription { get; set; }
    public string? ImageEvidence { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = null!;
    public string? RescueType { get; set; }
    public string? SuggestedPartsJson { get; set; }
    public int? ServiceAdvisorID { get; set; }
    public int? AssignedTechnicianID { get; set; }
    public DateTime? EstimatedArrivalDateTime { get; set; }
    public int? ResultingMaintenanceID { get; set; }
    public decimal ServiceFee { get; set; }
    public bool RequiresDeposit { get; set; }
    public decimal DepositAmount { get; set; }
    public bool IsDepositPaid { get; set; }
    public DateTime? DepositPaidDate { get; set; }
    public bool IsDepositConfirmed { get; set; }
    public DateTime? DepositConfirmedDate { get; set; }
    public int? DepositConfirmedByID { get; set; }
    public string? DepositPaymentMethod { get; set; }
    public string? DepositTransactionReference { get; set; }
    public int? RescueRating { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    public virtual User? AssignedTechnician { get; set; }
    public virtual Car Car { get; set; } = null!;
    public virtual User Customer { get; set; } = null!;
    public virtual CarMaintenance? ResultingMaintenance { get; set; }
    public virtual User? ServiceAdvisor { get; set; }
}
