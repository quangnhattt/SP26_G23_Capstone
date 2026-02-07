namespace AGMS.Application.Entities;

/// <summary>
/// Application-level verification code model for OTP flows. Infrastructure maps from persistence entity to this.
/// </summary>
public class VerificationCode
{
    public int Id { get; set; }
    public string ContactInfo { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Type { get; set; } = null!;
    public DateTime ExpiryTime { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedDate { get; set; }
}
