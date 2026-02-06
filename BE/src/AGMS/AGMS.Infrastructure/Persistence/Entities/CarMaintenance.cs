using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class CarMaintenance
{
    public int MaintenanceID { get; set; }

    public int CarID { get; set; }

    public int? AppointmentID { get; set; }

    public DateTime MaintenanceDate { get; set; }

    public int? Odometer { get; set; }

    public string Status { get; set; } = null!;

    public decimal TotalAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public string MaintenanceType { get; set; } = null!;

    public decimal MemberDiscountAmount { get; set; }

    public decimal MemberDiscountPercent { get; set; }

    public string? RankAtTimeOfService { get; set; }

    public decimal? FinalAmount { get; set; }

    public string? Notes { get; set; }

    public int? BayID { get; set; }

    public int CreatedBy { get; set; }

    public int? AssignedTechnicianID { get; set; }

    public string? TechnicianHistory { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? CompletedDate { get; set; }

    public virtual Appointment? Appointment { get; set; }

    public virtual User? AssignedTechnician { get; set; }

    public virtual ServiceBay? Bay { get; set; }

    public virtual Car Car { get; set; } = null!;

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual ICollection<MaintenanceMedium> MaintenanceMedia { get; set; } = new List<MaintenanceMedium>();

    public virtual ICollection<MaintenancePackageUsage> MaintenancePackageUsages { get; set; } = new List<MaintenancePackageUsage>();

    public virtual ICollection<MaintenanceStatusLog> MaintenanceStatusLogs { get; set; } = new List<MaintenanceStatusLog>();

    public virtual ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();

    public virtual ICollection<RescueRequest> RescueRequests { get; set; } = new List<RescueRequest>();

    public virtual ICollection<ServiceDetail> ServiceDetails { get; set; } = new List<ServiceDetail>();

    public virtual ICollection<ServiceEvaluation> ServiceEvaluations { get; set; } = new List<ServiceEvaluation>();

    public virtual ICollection<ServicePartDetail> ServicePartDetails { get; set; } = new List<ServicePartDetail>();

    public virtual ICollection<Transfer_Order> Transfer_Orders { get; set; } = new List<Transfer_Order>();

    public virtual ICollection<WarrantyClaim> WarrantyClaimOriginalMaintenances { get; set; } = new List<WarrantyClaim>();

    public virtual ICollection<WarrantyClaim> WarrantyClaimResultingMaintenances { get; set; } = new List<WarrantyClaim>();
}
