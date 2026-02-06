using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Permission
{
    public int PermissionID { get; set; }

    public string Name { get; set; } = null!;

    public string? URL { get; set; }

    public string? Description { get; set; }

    public int? GroupID { get; set; }

    public virtual PermissionGroup? Group { get; set; }

    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
}
