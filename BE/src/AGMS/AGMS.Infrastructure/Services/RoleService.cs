using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Role;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class RoleService : IRoleService
    {
        private readonly IRoleRepository _roleRepository;

        public RoleService(IRoleRepository roleRepository)
        {
            _roleRepository = roleRepository;
        }

        public async Task<IEnumerable<RoleDto>> GetAllRolesAsync()
        {
            var roles = await _roleRepository.GetAllAsync();
            
            return roles.Select(r => new RoleDto
            {
                RoleID = r.RoleID,
                RoleName = r.RoleName,
                Description = r.Description,
                IsActive = r.IsActive
            });
        }
    }
}
