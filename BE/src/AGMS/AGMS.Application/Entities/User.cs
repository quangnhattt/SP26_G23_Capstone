namespace AGMS.Application.Entities;

/// <summary>
/// Application-level user model for auth contracts. Infrastructure maps from persistence entity to this.
/// </summary>
public class User
{
    public int UserID { get; set; }
    public string UserCode { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? PasswordSalt { get; set; }
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public int RoleID { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}
