using AGMS.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IRoleRepository
    {
        Task<IEnumerable<Role>> GetAllAsync();
        Task<Role?> GetByIdWithPermissionsAsync(int roleId);
        Task UpdateAsync(Role role);
    }
}