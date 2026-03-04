namespace AGMS.Application.DTOs.Role
{
    // DTO trả về danh sách Role cho Admin
    public class RoleDto
    {
        public int RoleID { get; set; }
        public string RoleName { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }

    // DTO để Thêm mới Role
    public class RoleCreateDto
    {
        public string RoleName { get; set; } = null!;
        public string? Description { get; set; }
        // Khi tạo mới, mặc định ở Service sẽ set IsActive = true
    }

    // DTO để Sửa Role
    public class RoleUpdateDto
    {
        public string RoleName { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
}