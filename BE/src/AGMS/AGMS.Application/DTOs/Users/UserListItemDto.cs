namespace AGMS.Application.DTOs.Users;

public class UserListItemDto
{
    public int UserID { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public int RoleID { get; set; }
    public string RoleName { get; set; } = null!;
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}