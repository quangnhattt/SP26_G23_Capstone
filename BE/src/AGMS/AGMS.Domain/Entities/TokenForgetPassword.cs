namespace AGMS.Domain.Entities;

public class TokenForgetPassword
{
    public int Id { get; set; }
    public string Token { get; set; } = null!;
    public DateTime ExpiryTime { get; set; }
    public bool IsUsed { get; set; }
    public int UserId { get; set; }

    public virtual User User { get; set; } = null!;
}
