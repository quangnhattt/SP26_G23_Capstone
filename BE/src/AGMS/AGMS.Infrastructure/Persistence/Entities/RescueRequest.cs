using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class RescueRequest
{
    public int RescueID { get; set; }

    public int CarID { get; set; }

    public int CustomerID { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public string CurrentAddress { get; set; } = null!;

    public string? ProblemDescription { get; set; }

    public string? ImageEvidence { get; set; }

    public string Status { get; set; } = null!;

    public string? RescueType { get; set; }

    public int? ServiceAdvisorID { get; set; }

    public int? AssignedTechnicianID { get; set; }

    public DateTime? EstimatedArrivalDateTime { get; set; }

    public int? ResultingMaintenanceID { get; set; }

    public decimal ServiceFee { get; set; }

    public int? RescueRating { get; set; }

    public DateTime CreatedDate { get; set; }

    public DateTime? CompletedDate { get; set; }

    public virtual User? AssignedTechnician { get; set; }

    public virtual Car Car { get; set; } = null!;

    public virtual User Customer { get; set; } = null!;

    public virtual CarMaintenance? ResultingMaintenance { get; set; }

    public virtual User? ServiceAdvisor { get; set; }
}
