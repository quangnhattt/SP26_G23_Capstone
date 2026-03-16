namespace AGMS.Application.Constants;

/// <summary>
/// RoleID (dưới dạng string) tương ứng với bảng [Role] trong database.
/// Dùng trực tiếp trong [Authorize(Roles = Roles.Admin)] hoặc kết hợp
/// [Authorize(Roles = Roles.Admin + "," + Roles.ServiceAdvisor)]
/// </summary>
public static class Roles
{
    public const string Admin          = "1";
    public const string ServiceAdvisor = "2";
    public const string Technician     = "3";
    public const string Customer       = "4";
}
