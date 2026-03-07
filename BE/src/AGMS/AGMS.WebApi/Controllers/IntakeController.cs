using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Intake;
using AGMS.Application.DTOs.ServiceOrder;
using Microsoft.AspNetCore.Authorization;
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
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(claim) || !int.TryParse(claim, out int userId))
            {
                return Unauthorized(new { message = "Invalid or missing user id claim." });
            }
            var isStaff = await _intakeService.IsStaffUserAsync(userId, ct);
            if (!isStaff)
            {
                return Forbid();
            }
            var item = await _intakeService.GetWaitingIntakesAsync(ct);
            return Ok(item);
        }

        [HttpPost("walk-in")]
        [ProducesResponseType(typeof(IntakeWalkInCreateResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CreateWalkIn([FromBody] IntakeWalkInCreateRequest request, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var createdByUserId))
                return Unauthorized(new { message = "Invalid or missing user id claim." });

            var isStaff = await _intakeService.IsStaffUserAsync(createdByUserId, ct);
            if (!isStaff)
                return Forbid();

            try
            {
                var result = await _intakeService.CreateWalkInIntakeAsync(request, createdByUserId, ct);
                return StatusCode(StatusCodes.Status201Created, result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpGet("{maintenanceId:int}")]
        [ProducesResponseType(typeof(ServiceOrderIntakeDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetIntakeDetail(int maintenanceId, CancellationToken ct)
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(claim) && int.TryParse(claim, out int userId))
            {
                var isStaff = await _intakeService.IsStaffUserAsync(userId, ct);
                if (!isStaff)
                {
                    return Forbid();
                }
                var intakeDetail = await _intakeService.GetIntakeDetailAsync(maintenanceId, ct);
                if (intakeDetail == null)
                {
                    return NotFound(new { message = $"No intake found for maintenance ID {maintenanceId}." });
                }
                return Ok(intakeDetail);
            }
            else
            {
                return Unauthorized(new { message = "Invalid or missing user id claim." });
            }

        }
    }
}
