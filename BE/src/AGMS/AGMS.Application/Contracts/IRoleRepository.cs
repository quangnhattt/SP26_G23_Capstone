using AGMS.Domain.Entities;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IRoleRepository
    {
        Task<Role?> GetByIdWithPermissionsAsync(int roleId);
        Task UpdateAsync(Role role);
    }
}