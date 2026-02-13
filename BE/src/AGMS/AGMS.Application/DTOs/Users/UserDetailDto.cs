namespace AGMS.Application.DTOs.Users;

public class UserDetailDto
{
    public int UserID { get; set; }
    public string UserCode { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Image { get; set; }
    public int RoleID { get; set; }
    public string RoleName { get; set; } = null!;
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}