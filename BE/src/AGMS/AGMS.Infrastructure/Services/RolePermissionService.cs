using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Role;
using AGMS.Domain.Entities; // Chứa class Role, Permission, PermissionGroup
using AGMS.Infrastructure.Persistence.Db; // Chứa CarServiceDbContext
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class RolePermissionService : IRolePermissionService
    {
        private readonly CarServiceDbContext _context; // Đã đổi chuẩn tên DBContext

        public RolePermissionService(CarServiceDbContext context)
        {
            _context = context;
        }

        // 1. LẤY MA TRẬN QUYỀN (Hiển thị các ô tick cho Admin)
        public async Task<List<PermissionGroupMatrixDto>> GetPermissionMatrixByRoleIdAsync(int roleId)
        {
            // Lấy Role cùng với danh sách quyền nó ĐANG CÓ (nhờ quan hệ Many-to-Many)
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.RoleID == roleId);

            var grantedPermissionIds = role?.Permissions.Select(p => p.PermissionID).ToList() ?? new List<int>();

            // Quét toàn bộ nhóm và quyền để tạo ma trận
            var matrix = await _context.PermissionGroups
                .Select(g => new PermissionGroupMatrixDto
                {
                    GroupID = g.GroupID,
                    GroupName = g.GroupName,
                    Permissions = _context.Permissions
                        .Where(p => p.GroupID == g.GroupID)
                        .Select(p => new PermissionDetailDto
                        {
                            PermissionID = p.PermissionID,
                            Name = p.Name,
                            Description = p.Description,
                            IsGranted = grantedPermissionIds.Contains(p.PermissionID) // Tick nếu đã có quyền
                        }).ToList()
                }).ToListAsync();

            return matrix;
        }

        // 2. LƯU QUYỀN MỚI TỪ ADMIN 
        public async Task<bool> UpdateRolePermissionsAsync(int roleId, List<int> permissionIds)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.RoleID == roleId);

            if (role == null)
                throw new Exception($"Không tìm thấy Role với ID = {roleId}");

            // Xóa sạch các quyền cũ đang có
            role.Permissions.Clear();

            if (permissionIds != null && permissionIds.Any())
            {
                // 1. Lọc các ID trùng lặp (phòng hờ FE gửi [1, 1, 2])
                var uniqueIds = permissionIds.Distinct().ToList();

                var newPermissions = await _context.Permissions
                    .Where(p => uniqueIds.Contains(p.PermissionID))
                    .ToListAsync();

                // 2. CHỐT CHẶN VALIDATION 
                if (newPermissions.Count != uniqueIds.Count)
                {
                    // Tìm ra chính xác những ID "ảo" để báo lỗi cho ngầu
                    var invalidIds = uniqueIds.Except(newPermissions.Select(p => p.PermissionID)).ToList();
                    throw new Exception($"Lỗi: Các quyền có ID [{string.Join(", ", invalidIds)}] không tồn tại trong hệ thống!");
                }

                // Gán quyền mới cho Role
                foreach (var p in newPermissions)
                {
                    role.Permissions.Add(p);
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // 3. BUILD MENU CHO USER SAU KHI LOGIN
        public async Task<List<MenuGroupDto>> GetDynamicMenuAsync(int roleId)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.RoleID == roleId);

            if (role == null) return new List<MenuGroupDto>();

            var allowedPermissionIds = role.Permissions.Select(p => p.PermissionID).ToList();

            var menu = await _context.PermissionGroups
                .Where(g => _context.Permissions.Any(p => p.GroupID == g.GroupID && allowedPermissionIds.Contains(p.PermissionID)))
                .Select(g => new MenuGroupDto
                {
                    GroupID = g.GroupID,
                    GroupName = g.GroupName,
                    Items = _context.Permissions
                        .Where(p => p.GroupID == g.GroupID && allowedPermissionIds.Contains(p.PermissionID))
                        .Select(p => new MenuItemDto
                        {
                            PermissionID = p.PermissionID,
                            Name = p.Name,
                            URL = p.URL
                        }).ToList()
                }).ToListAsync();

            return menu;
        }
    }
}