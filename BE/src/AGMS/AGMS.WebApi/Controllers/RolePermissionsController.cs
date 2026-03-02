using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Role;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RolePermissionsController : ControllerBase
    {
        private readonly IRolePermissionService _service;

        public RolePermissionsController(IRolePermissionService service)
        {
            _service = service;
        }

        // API 1: Lấy Ma trận phân quyền (Dành cho màn hình Admin)
        [HttpGet("matrix/{roleId}")]
        public async Task<IActionResult> GetMatrix(int roleId)
        {
            var matrix = await _service.GetPermissionMatrixByRoleIdAsync(roleId);
            return Ok(matrix);
        }

        // API 2: Cập nhật phân quyền (Dành cho màn hình Admin)
        [HttpPut("{roleId}")]
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

        // API 3: Lấy danh sách Menu động theo RoleID (Dành cho Sidebar/Header Frontend)
        // Lưu ý: Hiện tại đang nhận roleId từ URL để dễ test. 
        // Sau này khi tích hợp Auth, có thể bỏ {roleId} và lấy từ User.Claims
        [HttpGet("menu/{roleId}")]
        public async Task<IActionResult> GetDynamicMenu(int roleId)
        {
            var menu = await _service.GetDynamicMenuAsync(roleId);

            if (menu == null || menu.Count == 0)
            {
                return Ok(new { message = "Không có dữ liệu menu hoặc nhóm quyền không tồn tại.", data = menu });
            }

            return Ok(menu);
        }
    }
}