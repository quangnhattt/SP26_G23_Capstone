using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Role
{
    // 1. DTO cho Admin Matrix
    public class PermissionDetailDto
    {
        public int PermissionID { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsGranted { get; set; }
    }

    public class PermissionGroupMatrixDto
    {
        public int GroupID { get; set; }
        public string GroupName { get; set; } = null!;
        public List<PermissionDetailDto> Permissions { get; set; } = new List<PermissionDetailDto>();
    }

    public class UpdateRolePermissionsDto
    {
        [Required(ErrorMessage = "Danh sách quyền không được để trống")]
        public List<int> PermissionIds { get; set; } = new List<int>();
    }

    // 2. DTO cho User Menu
    public class MenuItemDto
    {
        public int PermissionID { get; set; }
        public string Name { get; set; } = null!;
        public string? URL { get; set; }
    }

    public class MenuGroupDto
    {
        public int GroupID { get; set; }
        public string GroupName { get; set; } = null!;
        public List<MenuItemDto> Items { get; set; } = new List<MenuItemDto>();
    }
}