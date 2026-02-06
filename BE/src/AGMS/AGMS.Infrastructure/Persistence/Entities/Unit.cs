using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class Unit
{
    public int UnitID { get; set; }

    public string Name { get; set; } = null!;

    public string? Type { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
