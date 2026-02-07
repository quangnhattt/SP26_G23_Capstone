namespace AGMS.Domain.Entities;

public class Role
{
    public int RoleID { get; set; }
    public string RoleName { get; set; } = null!;
    public string? Description { get; set; }
}
