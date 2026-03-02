using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Permission
{
    // DTO dùng để trả dữ liệu ra (GET)
    public class PermissionGroupDto
    {
        public int GroupID { get; set; }
        public string GroupName { get; set; } = null!;
        public string? Description { get; set; }
    }

    // DTO dùng để thêm mới (POST)
    public class PermissionGroupCreateDto
    {
        [Required(ErrorMessage = "Tên nhóm quyền không được để trống")]
        [StringLength(100, ErrorMessage = "Tên nhóm quyền không được vượt quá 100 ký tự")]
        public string GroupName { get; set; } = null!;

        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        public string? Description { get; set; }
    }

    // DTO dùng để cập nhật (PUT)
    public class PermissionGroupUpdateDto : PermissionGroupCreateDto
    {
    }
}