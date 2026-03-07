using AGMS.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
            var item = await _intakeService.GetWaitingIntakesAsync(ct);
            return Ok(item);
        }
    }
}
