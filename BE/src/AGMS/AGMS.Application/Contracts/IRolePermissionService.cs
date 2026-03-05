using AGMS.Application.DTOs.Role; 
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IRolePermissionService
    {
        // 1. Dành cho Admin: Lấy Ma trận quyền của 1 Role để hiển thị lên bảng
        Task<List<PermissionGroupMatrixDto>> GetPermissionMatrixByRoleIdAsync(int roleId);

        // 2. Dành cho Admin: Cập nhật lại danh sách quyền (Lưu các ô Tick box)
        Task<bool> UpdateRolePermissionsAsync(int roleId, List<int> permissionIds);

        // 3. Dành cho User: Lấy Menu động khi đăng nhập
        Task<List<MenuGroupDto>> GetDynamicMenuAsync(int roleId);
    }
}