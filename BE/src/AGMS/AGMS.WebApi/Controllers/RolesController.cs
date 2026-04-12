using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        // View Roles
        [HttpGet]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var result = await _roleService.GetAllRolesAsync();
                return Ok(new { Message = "Successfully retrieved roles", Data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = "MSG_SYS01: System error occurred while processing your request.",
                    Error = ex.Message
                });
            }
        }
    }
}
