using AGMS.Application.DTOs.Permission;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IPermissionGroupService
    {
        Task<List<PermissionGroupDto>> GetAllGroupsAsync();
        Task<PermissionGroupDto?> GetGroupByIdAsync(int groupId);
        Task<int> CreateGroupAsync(PermissionGroupCreateDto request);
        Task<bool> UpdateGroupAsync(int groupId, PermissionGroupUpdateDto request);
        Task<bool> DeleteGroupAsync(int groupId);
    }
}