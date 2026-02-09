namespace AGMS.Domain.Entities;

public class PermissionGroup
{
    public int GroupID { get; set; }
    public string GroupName { get; set; } = null!;
    public string? Description { get; set; }

    public virtual ICollection<Permission> Permissions { get; set; } = new List<Permission>();
}
