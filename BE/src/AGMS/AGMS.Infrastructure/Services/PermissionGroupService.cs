using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Permission;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class PermissionGroupService : IPermissionGroupService
    {
        private readonly CarServiceDbContext _context;

        public PermissionGroupService(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<List<PermissionGroupDto>> GetAllGroupsAsync()
        {
            return await _context.PermissionGroups
                .Select(g => new PermissionGroupDto
                {
                    GroupID = g.GroupID,
                    GroupName = g.GroupName,
                    Description = g.Description
                })
                .ToListAsync();
        }

        public async Task<PermissionGroupDto?> GetGroupByIdAsync(int groupId)
        {
            var group = await _context.PermissionGroups
                .Where(g => g.GroupID == groupId)
                .Select(g => new PermissionGroupDto
                {
                    GroupID = g.GroupID,
                    GroupName = g.GroupName,
                    Description = g.Description
                })
                .FirstOrDefaultAsync();

            return group;
        }

        public async Task<int> CreateGroupAsync(PermissionGroupCreateDto request)
        {
            // Kiểm tra tính duy nhất của GroupName
            var nameExists = await _context.PermissionGroups
                .AnyAsync(g => g.GroupName.ToLower() == request.GroupName.ToLower());

            if (nameExists)
                throw new Exception($"Tên nhóm quyền '{request.GroupName}' đã tồn tại.");

            var newGroup = new PermissionGroup
            {
                GroupName = request.GroupName,
                Description = request.Description
            };

            _context.PermissionGroups.Add(newGroup);
            await _context.SaveChangesAsync();

            return newGroup.GroupID;
        }

        public async Task<bool> UpdateGroupAsync(int groupId, PermissionGroupUpdateDto request)
        {
            var group = await _context.PermissionGroups.FirstOrDefaultAsync(g => g.GroupID == groupId);
            if (group == null)
                throw new Exception($"Không tìm thấy Nhóm quyền với ID = {groupId}");

            // Kiểm tra tính duy nhất của GroupName, loại trừ chính nhóm đang được cập nhật
            var nameExists = await _context.PermissionGroups
                .AnyAsync(g => g.GroupName.ToLower() == request.GroupName.ToLower() && g.GroupID != groupId);

            if (nameExists)
                throw new Exception($"Tên nhóm quyền '{request.GroupName}' đã tồn tại.");

            group.GroupName = request.GroupName;
            group.Description = request.Description;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteGroupAsync(int groupId)
        {
            var group = await _context.PermissionGroups.FirstOrDefaultAsync(g => g.GroupID == groupId);
            if (group == null)
                throw new Exception($"Không tìm thấy Nhóm quyền với ID = {groupId}");

            // Ràng buộc toàn vẹn: Không cho phép xóa nếu có quyền con (Permission) thuộc nhóm này
            var hasChildPermissions = await _context.Permissions.AnyAsync(p => p.GroupID == groupId);
            if (hasChildPermissions)
                throw new Exception("Không thể xóa nhóm quyền này vì vẫn còn các quyền con (Permissions) đang trực thuộc. Vui lòng chuyển hoặc xóa các quyền con trước.");

            _context.PermissionGroups.Remove(group);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}