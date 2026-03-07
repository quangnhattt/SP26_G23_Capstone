using AGMS.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AGMS.WebApi.Controllers
{
    [Route("api/intake")]
    [ApiController]
    [Authorize]
    public class IntakeController : ControllerBase
    {
        private readonly ICarMaintenanceIntakeService _intakeService;
        public IntakeController(ICarMaintenanceIntakeService intakeService)
        {
            _intakeService = intakeService;
        }
        [HttpGet]
        public async Task<IActionResult> GetIntakes(CancellationToken ct)
        {
            var claim=User.FindFirstValue(ClaimTypes.NameIdentifier);
            if(string.IsNullOrWhiteSpace(claim) || !int.TryParse(claim, out int userId))
            {
                return Unauthorized(new { message = "Invalid or missing user id claim." });
            }
            var isStaff=await _intakeService.IsStaffUserAsync(userId, ct);
            if (!isStaff)
            {
                return Forbid();
            }
            var item = await _intakeService.GetWaitingIntakesAsync(ct);
            return Ok(item);
        }
    }
}
