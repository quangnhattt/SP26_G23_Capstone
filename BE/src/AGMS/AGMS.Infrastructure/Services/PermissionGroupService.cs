using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Permission;
using AGMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class PermissionGroupService : IPermissionGroupService
    {
        private readonly IPermissionGroupRepository _groupRepo;

        public PermissionGroupService(IPermissionGroupRepository groupRepo)
        {
            _groupRepo = groupRepo;
        }

        public async Task<List<PermissionGroupDto>> GetAllGroupsAsync()
        {
            var groups = await _groupRepo.GetAllAsync();
            return groups.Select(g => new PermissionGroupDto
            {
                GroupID = g.GroupID,
                GroupName = g.GroupName,
                Description = g.Description
            }).ToList();
        }

        public async Task<PermissionGroupDto?> GetGroupByIdAsync(int groupId)
        {
            var group = await _groupRepo.GetByIdAsync(groupId);
            if (group == null) return null;

            return new PermissionGroupDto
            {
                GroupID = group.GroupID,
                GroupName = group.GroupName,
                Description = group.Description
            };
        }

        public async Task<int> CreateGroupAsync(PermissionGroupCreateDto request)
        {
            if (await _groupRepo.ExistsByNameAsync(request.GroupName))
                throw new Exception($"Tên nhóm quyền '{request.GroupName}' đã tồn tại.");

            var newGroup = new PermissionGroup
            {
                GroupName = request.GroupName,
                Description = request.Description
            };

            await _groupRepo.AddAsync(newGroup);
            return newGroup.GroupID;
        }

        public async Task<bool> UpdateGroupAsync(int groupId, PermissionGroupUpdateDto request)
        {
            var group = await _groupRepo.GetByIdAsync(groupId);
            if (group == null) throw new Exception($"Không tìm thấy Nhóm quyền với ID = {groupId}");

            if (await _groupRepo.ExistsByNameAsync(request.GroupName, groupId))
                throw new Exception($"Tên nhóm quyền '{request.GroupName}' đã tồn tại.");

            group.GroupName = request.GroupName;
            group.Description = request.Description;

            await _groupRepo.UpdateAsync(group);
            return true;
        }

        public async Task<bool> DeleteGroupAsync(int groupId)
        {
            var group = await _groupRepo.GetByIdAsync(groupId);
            if (group == null) throw new Exception($"Không tìm thấy Nhóm quyền với ID = {groupId}");

            if (await _groupRepo.HasChildPermissionsAsync(groupId))
                throw new Exception("Không thể xóa nhóm quyền này vì vẫn còn các quyền con (Permissions) đang trực thuộc. Vui lòng chuyển hoặc xóa các quyền con trước.");

            await _groupRepo.DeleteAsync(group);
            return true;
        }
    }
}