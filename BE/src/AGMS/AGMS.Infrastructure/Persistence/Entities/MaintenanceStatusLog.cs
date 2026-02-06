using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class MaintenanceStatusLog
{
    public int LogID { get; set; }

    public int MaintenanceID { get; set; }

    public string? OldStatus { get; set; }

    public string? NewStatus { get; set; }

    public int? ChangedBy { get; set; }

    public DateTime ChangedDate { get; set; }

    public string? Note { get; set; }

    public virtual User? ChangedByNavigation { get; set; }

    public virtual CarMaintenance Maintenance { get; set; } = null!;
}
