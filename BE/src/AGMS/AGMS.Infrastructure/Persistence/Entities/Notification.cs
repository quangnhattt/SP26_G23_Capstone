using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Notification
{
    public int NotificationID { get; set; }

    public int UserID { get; set; }

    public string? Title { get; set; }

    public string? Message { get; set; }

    public string? Type { get; set; }

    public int? ReferenceID { get; set; }

    public bool IsRead { get; set; }

    public DateTime CreatedDate { get; set; }

    public virtual User User { get; set; } = null!;
}
