using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class MaintenanceMedium
{
    public int MediaID { get; set; }

    public int MaintenanceID { get; set; }

    public string URL { get; set; } = null!;

    public string? Type { get; set; }

    public string? Description { get; set; }

    public int? UploadedBy { get; set; }

    public DateTime UploadedDate { get; set; }

    public virtual CarMaintenance Maintenance { get; set; } = null!;

    public virtual User? UploadedByNavigation { get; set; }
}
