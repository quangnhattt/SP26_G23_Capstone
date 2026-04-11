using AGMS.Application.DTOs.Role;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IRoleService
    {
        Task<IEnumerable<RoleDto>> GetAllRolesAsync();
    }
}
