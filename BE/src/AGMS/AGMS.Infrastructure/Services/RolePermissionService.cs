using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Role;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class RolePermissionService : IRolePermissionService
    {
        private readonly IRoleRepository _roleRepo;
        private readonly IPermissionGroupRepository _groupRepo;
        private readonly IPermissionRepository _permissionRepo;

        public RolePermissionService(IRoleRepository roleRepo, IPermissionGroupRepository groupRepo, IPermissionRepository permissionRepo)
        {
            _roleRepo = roleRepo;
            _groupRepo = groupRepo;
            _permissionRepo = permissionRepo;
        }

        public async Task<List<PermissionGroupMatrixDto>> GetPermissionMatrixByRoleIdAsync(int roleId)
        {
            var role = await _roleRepo.GetByIdWithPermissionsAsync(roleId);

            // 1 Kiểm tra Role có tồn tại không
            if (role == null)
            {
                throw new Exception($"Không tìm thấy Nhóm người dùng (Role) với ID = {roleId}");
            }

            var grantedPermissionIds = role.Permissions.Select(p => p.PermissionID).ToList();

            var groups = await _groupRepo.GetAllWithPermissionsAsync();

            return groups.Select(g => new PermissionGroupMatrixDto
            {
                GroupID = g.GroupID,
                GroupName = g.GroupName,
                Permissions = g.Permissions.Select(p => new PermissionDetailDto
                {
                    PermissionID = p.PermissionID,
                    Name = p.Name,
                    Description = p.Description,
                    IsGranted = grantedPermissionIds.Contains(p.PermissionID)
                }).ToList()
            }).ToList();
        }

        public async Task<bool> UpdateRolePermissionsAsync(int roleId, List<int> permissionIds)
        {
            var role = await _roleRepo.GetByIdWithPermissionsAsync(roleId);
            if (role == null) throw new Exception($"Không tìm thấy Role với ID = {roleId}");

            role.Permissions.Clear();

            if (permissionIds != null && permissionIds.Any())
            {
                var uniqueIds = permissionIds.Distinct().ToList();
                var newPermissions = await _permissionRepo.GetByIdsAsync(uniqueIds);

                if (newPermissions.Count != uniqueIds.Count)
                {
                    var invalidIds = uniqueIds.Except(newPermissions.Select(p => p.PermissionID)).ToList();
                    throw new Exception($"Lỗi: Các quyền có ID [{string.Join(", ", invalidIds)}] không tồn tại trong hệ thống!");
                }

                foreach (var p in newPermissions)
                {
                    role.Permissions.Add(p);
                }
            }

            await _roleRepo.UpdateAsync(role);
            return true;
        }

        public async Task<List<MenuGroupDto>> GetDynamicMenuAsync(int roleId)
        {
            var role = await _roleRepo.GetByIdWithPermissionsAsync(roleId);
            if (role == null) return new List<MenuGroupDto>();

            // 1. Lấy danh sách ID các quyền của Role
            var allowedPermissionIds = role.Permissions.Select(p => p.PermissionID).ToList();

            // 2. Lấy tất cả các nhóm quyền từ DB
            var groups = await _groupRepo.GetAllWithPermissionsAsync();

            // 3. Bảng thứ tự hiển thị menu (so sánh Contains, chịu được sai chính tả)
            // Thứ tự: dashboard → product → package → category → service → supplier → inventory → còn lại
            var priorityMap = new (string keyword, int order)[]
            {
                ("dashboard",  0),
                ("product",    1),
                ("package",    2),
                ("category",   3),
                ("service",    4),
                ("supplier",   5),
                ("inventory",  6),
            };

            int GetPriority(string groupName)
            {
                var lower = groupName.ToLower();
                foreach (var (keyword, order) in priorityMap)
                    if (lower.Contains(keyword)) return order;
                return 99; // các mục còn lại xếp cuối
            }

            // 4. Lọc, sắp xếp theo priority rồi theo GroupID (tie-break)
            return groups
                .Where(g => g.Permissions.Any(p => allowedPermissionIds.Contains(p.PermissionID)))
                .Select(g => new MenuGroupDto
                {
                    GroupID = g.GroupID,
                    GroupName = g.GroupName
                })
                .OrderBy(g => GetPriority(g.GroupName))
                .ThenBy(g => g.GroupID)
                .ToList();
        }
    }
}