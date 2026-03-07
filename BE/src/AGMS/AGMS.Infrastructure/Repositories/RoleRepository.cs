using AGMS.Application.Contracts;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Repositories
{
    public class RoleRepository : IRoleRepository
    {
        private readonly CarServiceDbContext _context;

        public RoleRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<Role?> GetByIdWithPermissionsAsync(int roleId)
        {
            return await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.RoleID == roleId);
        }

        public async Task UpdateAsync(Role role)
        {
            _context.Roles.Update(role);
            await _context.SaveChangesAsync();
        }
    }
}