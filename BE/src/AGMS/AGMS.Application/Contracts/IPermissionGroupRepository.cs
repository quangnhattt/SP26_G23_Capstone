using AGMS.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IPermissionGroupRepository
    {
        Task<List<PermissionGroup>> GetAllAsync();
        Task<PermissionGroup?> GetByIdAsync(int id);
        Task<bool> ExistsByNameAsync(string name, int? excludeId = null);
        Task<bool> HasChildPermissionsAsync(int groupId);
        Task<List<PermissionGroup>> GetAllWithPermissionsAsync();
        Task AddAsync(PermissionGroup group);
        Task UpdateAsync(PermissionGroup group);
        Task DeleteAsync(PermissionGroup group);
    }
}