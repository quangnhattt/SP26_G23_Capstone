using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Permission;
using AGMS.Domain.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly IPermissionRepository _permissionRepo;
        private readonly IPermissionGroupRepository _groupRepo;

        public PermissionService(IPermissionRepository permissionRepo, IPermissionGroupRepository groupRepo)
        {
            _permissionRepo = permissionRepo;
            _groupRepo = groupRepo;
        }

        public async Task<int> CreatePermissionAsync(PermissionCreateDto request)
        {
            if (await _groupRepo.GetByIdAsync(request.GroupID) == null)
                throw new Exception($"Không tìm thấy Nhóm quyền với ID = {request.GroupID}");

            if (await _permissionRepo.ExistsByNameAsync(request.Name))
                throw new Exception($"Tên quyền '{request.Name}' đã tồn tại trong hệ thống.");

            if (!string.IsNullOrWhiteSpace(request.URL) && await _permissionRepo.ExistsByUrlAsync(request.URL))
                throw new Exception($"Đường dẫn URL '{request.URL}' đã được sử dụng cho một quyền khác.");

            var permission = new Permission
            {
                Name = request.Name,
                URL = request.URL,
                Description = request.Description,
                GroupID = request.GroupID
            };

            await _permissionRepo.AddAsync(permission);
            return permission.PermissionID;
        }

        public async Task<bool> UpdatePermissionAsync(int permissionId, PermissionUpdateDto request)
        {
            var permission = await _permissionRepo.GetByIdAsync(permissionId);
            if (permission == null) throw new Exception($"Không tìm thấy Quyền với ID = {permissionId}");

            if (await _groupRepo.GetByIdAsync(request.GroupID) == null)
                throw new Exception($"Không tìm thấy Nhóm quyền với ID = {request.GroupID}");

            if (await _permissionRepo.ExistsByNameAsync(request.Name, permissionId))
                throw new Exception($"Tên quyền '{request.Name}' đã tồn tại trong hệ thống.");

            if (!string.IsNullOrWhiteSpace(request.URL) && await _permissionRepo.ExistsByUrlAsync(request.URL, permissionId))
                throw new Exception($"Đường dẫn URL '{request.URL}' đã được sử dụng cho một quyền khác.");

            permission.Name = request.Name;
            permission.URL = request.URL;
            permission.Description = request.Description;
            permission.GroupID = request.GroupID;

            await _permissionRepo.UpdateAsync(permission);
            return true;
        }

        public async Task<bool> DeletePermissionAsync(int permissionId)
        {
            var permission = await _permissionRepo.GetByIdWithRolesAsync(permissionId);
            if (permission == null) throw new Exception($"Không tìm thấy Quyền với ID = {permissionId}");

            if (permission.Roles != null && permission.Roles.Any())
                throw new Exception("Không thể xóa quyền này vì đang có nhóm người dùng (Role) sử dụng.");

            await _permissionRepo.DeleteAsync(permission);
            return true;
        }
    }
}