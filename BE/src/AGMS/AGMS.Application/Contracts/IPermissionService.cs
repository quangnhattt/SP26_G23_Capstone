using AGMS.Application.DTOs.Permission;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IPermissionService
    {
        Task<int> CreatePermissionAsync(PermissionCreateDto request);
        Task<bool> UpdatePermissionAsync(int permissionId, PermissionUpdateDto request);
        Task<bool> DeletePermissionAsync(int permissionId);
    }
}