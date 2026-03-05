using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Permission;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly CarServiceDbContext _context;

        public PermissionService(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<int> CreatePermissionAsync(PermissionCreateDto request)
        {
            // 1. Kiểm tra GroupID có tồn tại
            var groupExists = await _context.PermissionGroups.AnyAsync(g => g.GroupID == request.GroupID);
            if (!groupExists)
                throw new Exception($"Không tìm thấy Nhóm quyền với ID = {request.GroupID}");

            // 2. Validate tính duy nhất của Name
            var nameExists = await _context.Permissions
                .AnyAsync(p => p.Name.ToLower() == request.Name.ToLower());
            if (nameExists)
                throw new Exception($"Tên quyền '{request.Name}' đã tồn tại trong hệ thống.");

            // 3. Validate tính duy nhất của URL (Chỉ kiểm tra nếu URL có giá trị)
            if (!string.IsNullOrWhiteSpace(request.URL))
            {
                var urlExists = await _context.Permissions
                    .AnyAsync(p => p.URL.ToLower() == request.URL.ToLower());
                if (urlExists)
                    throw new Exception($"Đường dẫn URL '{request.URL}' đã được sử dụng cho một quyền khác.");
            }

            var permission = new Permission
            {
                Name = request.Name,
                URL = request.URL,
                Description = request.Description,
                GroupID = request.GroupID
            };

            _context.Permissions.Add(permission);
            await _context.SaveChangesAsync();

            return permission.PermissionID;
        }

        public async Task<bool> UpdatePermissionAsync(int permissionId, PermissionUpdateDto request)
        {
            var permission = await _context.Permissions.FirstOrDefaultAsync(p => p.PermissionID == permissionId);
            if (permission == null)
                throw new Exception($"Không tìm thấy Quyền với ID = {permissionId}");

            // 1. Kiểm tra GroupID có tồn tại
            var groupExists = await _context.PermissionGroups.AnyAsync(g => g.GroupID == request.GroupID);
            if (!groupExists)
                throw new Exception($"Không tìm thấy Nhóm quyền với ID = {request.GroupID}");

            // 2. Validate tính duy nhất của Name (Loại trừ ID của chính quyền đang cập nhật)
            var nameExists = await _context.Permissions
                .AnyAsync(p => p.Name.ToLower() == request.Name.ToLower() && p.PermissionID != permissionId);
            if (nameExists)
                throw new Exception($"Tên quyền '{request.Name}' đã tồn tại trong hệ thống.");

            // 3. Validate tính duy nhất của URL (Loại trừ ID hiện tại)
            if (!string.IsNullOrWhiteSpace(request.URL))
            {
                var urlExists = await _context.Permissions
                    .AnyAsync(p => p.URL.ToLower() == request.URL.ToLower() && p.PermissionID != permissionId);
                if (urlExists)
                    throw new Exception($"Đường dẫn URL '{request.URL}' đã được sử dụng cho một quyền khác.");
            }

            // Cập nhật dữ liệu
            permission.Name = request.Name;
            permission.URL = request.URL;
            permission.Description = request.Description;
            permission.GroupID = request.GroupID;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePermissionAsync(int permissionId)
        {
            var permission = await _context.Permissions
                .Include(p => p.Roles)
                .FirstOrDefaultAsync(p => p.PermissionID == permissionId);

            if (permission == null)
                throw new Exception($"Không tìm thấy Quyền với ID = {permissionId}");

            // Ràng buộc toàn vẹn: Không cho phép xóa nếu đang có Role tham chiếu tới quyền này
            if (permission.Roles != null && permission.Roles.Any())
                throw new Exception("Không thể xóa quyền này vì đang có nhóm người dùng (Role) sử dụng.");

            // Thực hiện Xóa cứng (Hard Delete) từ cơ sở dữ liệu
            _context.Permissions.Remove(permission);

            await _context.SaveChangesAsync();
            return true;
        }
    }
}