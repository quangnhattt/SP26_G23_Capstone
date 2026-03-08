using System.Security.Claims;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Appointments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly IAppointmentRepository _appointmentRepo;

    public AppointmentsController(IAppointmentService appointmentService, IAppointmentRepository appointmentRepo)
    {
        _appointmentService = appointmentService;
        _appointmentRepo = appointmentRepo;
    }

    // POST /api/appointments/{id}/approve — SA bấm nút Approve: chỉ đổi trạng thái, không trả DTO
    [HttpPost("{id:int}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        var isSA = await IsServiceAdvisorAsync(userId, ct);
        if (!isSA)
            return Forbid();

        try
        {
            await _appointmentService.ApproveAsync(id, userId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid(); // Chỉ RoleID = 2 (SA) mới được approve
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/appointments — Customer: chỉ thấy của mình. SA (RoleID=2): thấy tất cả
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppointmentListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetList([FromQuery] AppointmentFilterDto filter, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        var isSA = await IsServiceAdvisorAsync(userId, ct);
        var items = await _appointmentService.GetListAsync(userId, isSA, filter, ct);
        return Ok(items);
    }

    // GET /api/appointments/{id} — Customer: chỉ xem của mình. SA: xem tất cả
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AppointmentDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDetail(int id, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        var isSA = await IsServiceAdvisorAsync(userId, ct);
        var detail = await _appointmentService.GetDetailAsync(id, userId, isSA, ct);

        if (detail == null)
            return NotFound(new { message = "Appointment not found or access denied." });

        return Ok(detail);
    }

    private (int userId, IActionResult? error) ExtractUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(claim) || !int.TryParse(claim, out var uid))
            return (0, Unauthorized(new { message = "Invalid or missing user id claim." }));
        return (uid, null);
    }

    // RoleID == 2 → Service Advisor
    private async Task<bool> IsServiceAdvisorAsync(int userId, CancellationToken ct)
    {
        var roleId = await _appointmentRepo.GetUserRoleIdAsync(userId, ct);
        return roleId == 2;
    }
    [HttpPost("{id:int}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reject(int id, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;
        var isSA = await IsServiceAdvisorAsync(userId, ct);
        if (!isSA)
            return Forbid();
        try
        {
            await _appointmentService.RejectAsync(id, userId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();

        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    } 
}
