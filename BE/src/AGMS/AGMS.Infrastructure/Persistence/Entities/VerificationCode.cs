using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class VerificationCode
{
    public int Id { get; set; }

    public string ContactInfo { get; set; } = null!;

    public string Code { get; set; } = null!;

    public string Type { get; set; } = null!;

    public DateTime ExpiryTime { get; set; }

    public bool IsUsed { get; set; }

    public DateTime CreatedDate { get; set; }
}
