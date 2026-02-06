using System;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Persistence.Entities;

public partial class TokenForgetPassword
{
    public int Id { get; set; }

    public string Token { get; set; } = null!;

    public DateTime ExpiryTime { get; set; }

    public bool IsUsed { get; set; }

    public int UserId { get; set; }

    public virtual User User { get; set; } = null!;
}
