using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Appointment
{
    public int AppointmentID { get; set; }

    public int CarID { get; set; }

    public DateTime AppointmentDate { get; set; }

    public int? RequestedPackageID { get; set; }

    public string Status { get; set; } = null!;

    public string? Notes { get; set; }

    public int CreatedBy { get; set; }

    public DateTime CreatedDate { get; set; }

    public int? ConfirmedBy { get; set; }

    public DateTime? ConfirmedDate { get; set; }

    public virtual ICollection<AppointmentServiceItem> AppointmentServiceItems { get; set; } = new List<AppointmentServiceItem>();

    public virtual Car Car { get; set; } = null!;

    public virtual ICollection<CarMaintenance> CarMaintenances { get; set; } = new List<CarMaintenance>();

    public virtual User? ConfirmedByNavigation { get; set; }

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual MaintenancePackage? RequestedPackage { get; set; }
}
