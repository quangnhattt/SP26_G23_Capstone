using AGMS.Application.Contracts;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Repositories
{
    public class PermissionGroupRepository : IPermissionGroupRepository
    {
        private readonly CarServiceDbContext _context;

        public PermissionGroupRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<List<PermissionGroup>> GetAllAsync()
        {
            return await _context.PermissionGroups.ToListAsync();
        }

        public async Task<PermissionGroup?> GetByIdAsync(int id)
        {
            return await _context.PermissionGroups.FirstOrDefaultAsync(g => g.GroupID == id);
        }

        public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null)
        {
            var query = _context.PermissionGroups.Where(g => g.GroupName.ToLower() == name.ToLower());
            if (excludeId.HasValue) query = query.Where(g => g.GroupID != excludeId.Value);
            return await query.AnyAsync();
        }

        public async Task<bool> HasChildPermissionsAsync(int groupId)
        {
            return await _context.Permissions.AnyAsync(p => p.GroupID == groupId);
        }

        public async Task<List<PermissionGroup>> GetAllWithPermissionsAsync()
        {
            return await _context.PermissionGroups
                .Include(g => g.Permissions)
                .ToListAsync();
        }

        public async Task AddAsync(PermissionGroup group)
        {
            _context.PermissionGroups.Add(group);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(PermissionGroup group)
        {
            _context.PermissionGroups.Update(group);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(PermissionGroup group)
        {
            _context.PermissionGroups.Remove(group);
            await _context.SaveChangesAsync();
        }
    }
}