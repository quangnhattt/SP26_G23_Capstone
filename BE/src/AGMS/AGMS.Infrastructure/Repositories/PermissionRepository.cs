using AGMS.Application.Contracts;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Repositories
{
    public class PermissionRepository : IPermissionRepository
    {
        private readonly CarServiceDbContext _context;

        public PermissionRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<Permission?> GetByIdAsync(int id)
        {
            return await _context.Permissions.FirstOrDefaultAsync(p => p.PermissionID == id);
        }

        public async Task<Permission?> GetByIdWithRolesAsync(int id)
        {
            return await _context.Permissions
                .Include(p => p.Roles)
                .FirstOrDefaultAsync(p => p.PermissionID == id);
        }

        public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null)
        {
            var query = _context.Permissions.Where(p => p.Name.ToLower() == name.ToLower());
            if (excludeId.HasValue) query = query.Where(p => p.PermissionID != excludeId.Value);
            return await query.AnyAsync();
        }

        public async Task<bool> ExistsByUrlAsync(string url, int? excludeId = null)
        {
            var query = _context.Permissions.Where(p => p.URL.ToLower() == url.ToLower());
            if (excludeId.HasValue) query = query.Where(p => p.PermissionID != excludeId.Value);
            return await query.AnyAsync();
        }

        public async Task<List<Permission>> GetByIdsAsync(List<int> ids)
        {
            return await _context.Permissions.Where(p => ids.Contains(p.PermissionID)).ToListAsync();
        }

        public async Task AddAsync(Permission permission)
        {
            _context.Permissions.Add(permission);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Permission permission)
        {
            _context.Permissions.Update(permission);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Permission permission)
        {
            _context.Permissions.Remove(permission);
            await _context.SaveChangesAsync();
        }
    }
}