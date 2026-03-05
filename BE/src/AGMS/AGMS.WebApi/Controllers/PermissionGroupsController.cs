using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Permission;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PermissionGroupsController : ControllerBase
    {
        private readonly IPermissionGroupService _service;

        public PermissionGroupsController(IPermissionGroupService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllGroupsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetGroupByIdAsync(id);
            if (result == null) return NotFound(new { message = $"Không tìm thấy nhóm quyền với ID = {id}" });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PermissionGroupCreateDto request)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                var id = await _service.CreateGroupAsync(request);
                return Ok(new { message = "Thêm nhóm quyền thành công", groupId = id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PermissionGroupUpdateDto request)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                await _service.UpdateGroupAsync(id, request);
                return Ok(new { message = "Cập nhật nhóm quyền thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.DeleteGroupAsync(id);
                return Ok(new { message = "Xóa nhóm quyền thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}