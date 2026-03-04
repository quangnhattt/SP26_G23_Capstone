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

            var allowedPermissionIds = role.Permissions.Select(p => p.PermissionID).ToList();
            var groups = await _groupRepo.GetAllWithPermissionsAsync();

            return groups
                .Where(g => g.Permissions.Any(p => allowedPermissionIds.Contains(p.PermissionID)))
                .Select(g => new MenuGroupDto
                {
                    GroupID = g.GroupID,
                    GroupName = g.GroupName,
                    Items = g.Permissions
                        .Where(p => allowedPermissionIds.Contains(p.PermissionID))
                        .Select(p => new MenuItemDto
                        {
                            PermissionID = p.PermissionID,
                            Name = p.Name,
                            URL = p.URL
                        }).ToList()
                }).ToList();
        }
    }
}