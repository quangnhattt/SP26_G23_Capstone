using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Role;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // CHỐT CHẶN CHUNG: Cứ có Token (đăng nhập rồi) là được vào Controller này
    public class RolePermissionsController : ControllerBase
    {
        private readonly IRolePermissionService _service;

        public RolePermissionsController(IRolePermissionService service)
        {
            _service = service;
        }

        // =========================================================
        // KHU VỰC CỦA ADMIN (Chỉ Admin mới được cấu hình quyền)
        // =========================================================

        [Authorize(Roles = Roles.Admin)] // Bọc riệng quyền Admin cho API này
        [HttpGet("matrix")]
        public async Task<IActionResult> GetMatrix(int roleId)
        {
            var matrix = await _service.GetPermissionMatrixByRoleIdAsync(roleId);
            return Ok(matrix);
        }

        [Authorize(Roles = Roles.Admin)] // Bọc riêng quyền Admin cho API này
        [HttpPut("editUserPermission")]
        public async Task<IActionResult> UpdatePermissions(int roleId, [FromBody] UpdateRolePermissionsDto request)
        {
            try
            {
                await _service.UpdateRolePermissionsAsync(roleId, request.PermissionIds);
                return Ok(new { message = "Cập nhật phân quyền thành công!" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // =========================================================
        // KHU VỰC CỦA TẤT CẢ USER (Lấy Menu hiển thị lên UI)
        // =========================================================

        // API 3: Tự động móc RoleID từ Token, KHÔNG cho truyền từ ngoài vào
        [HttpGet("/api/menu-access")]
        public async Task<IActionResult> GetMyDynamicMenu()
        {
            // 1. Lôi cổ RoleID từ trong Token ra (ClaimTypes.Role)
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            // 2. Nếu Token bị lỗi không có Role, đá văng ra ngay
            if (string.IsNullOrEmpty(roleClaim) || !int.TryParse(roleClaim, out int loggedInRoleId))
            {
                return Unauthorized(new { message = "Token không hợp lệ hoặc thiếu thông tin phân quyền." });
            }

            // 3. Trả về Menu chuẩn xác của đúng người đó
            var menu = await _service.GetDynamicMenuAsync(loggedInRoleId);

            if (menu == null || menu.Count == 0)
            {
                return Ok(new { message = "Không có dữ liệu menu hoặc nhóm quyền không tồn tại.", data = menu });
            }

            return Ok(menu);
        }
    }
}