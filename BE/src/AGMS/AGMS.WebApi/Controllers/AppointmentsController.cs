using System.Security.Claims;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Appointments;
using AGMS.Application.DTOs.Scheduling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly IRepairRequestService _repairRequestService;

    public AppointmentsController(
        IAppointmentService appointmentService,
        IRepairRequestService repairRequestService)
    {
        _appointmentService = appointmentService;
        _repairRequestService = repairRequestService;
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
    [ProducesResponseType(typeof(AppointmentPagedResultDto<AppointmentListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetList([FromQuery] AppointmentFilterDto filter, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        var roleId = await _appointmentService.GetUserRoleIdAsync(userId, ct);
        bool canSeeAll = (roleId == 1 || roleId == 2);

        var items = await _appointmentService.GetListAsync(userId, canSeeAll, filter, ct);
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

        var roleId = await _appointmentService.GetUserRoleIdAsync(userId, ct);
        bool canSeeAll = (roleId == 1 || roleId == 2);
        var detail = await _appointmentService.GetDetailAsync(id, userId, canSeeAll, ct);

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
        var roleId = await _appointmentService.GetUserRoleIdAsync(userId, ct);
        return roleId == 2;
    }
    [HttpPost("{id:int}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectAppointmentRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, error) = ExtractUserId();
        if (error != null) return error;
        var isSA = await IsServiceAdvisorAsync(userId, ct);
        if (!isSA)
            return Forbid();
        try
        {
            await _appointmentService.RejectAsync(id, userId, request.Reason, ct);
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

    // POST /api/appointments/{id}/check-in — SA bấm nút Check-in: đổi status → CHECKED_IN và tạo CarMaintenance RECEIVED
    [HttpPost("{id:int}/check-in")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckIn(int id, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        var isSA = await IsServiceAdvisorAsync(userId, ct);
        if (!isSA)
            return Forbid();

        try
        {
            await _appointmentService.CheckInAsync(id, userId, ct);
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

    [HttpPost("{id:int}/propose-reschedule")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProposeReschedule(int id, [FromBody] ProposeRescheduleRequest request, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        var isSA = await IsServiceAdvisorAsync(userId, ct);
        if (!isSA)
            return Forbid();

        try
        {
            await _appointmentService.ProposeRescheduleAsync(id, userId, request.Reason, ct);
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

    [HttpPost("{id:int}/respond-reschedule")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RespondReschedule(int id, [FromBody] RespondRescheduleRequest request, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        try
        {
            await _appointmentService.RespondRescheduleAsync(id, userId, request, ct);
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

    // === Scheduling: Khung giờ đặt lịch ===

    /// <summary>
    /// Lấy danh sách khung giờ khả dụng trong 1 ngày.
    /// Trả về 9 slot (08:00-17:00), mỗi slot kèm trạng thái còn chỗ hay không.
    /// </summary>
    [HttpGet("available-slots")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(DayAvailabilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAvailableSlots([FromQuery] string date, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(date))
            return BadRequest(new { message = "Query parameter 'date' is required (yyyy-MM-dd)." });

        try
        {
            var result = await _repairRequestService.GetAvailableSlotsAsync(date, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách KTV rảnh trong 1 slot cụ thể.
    /// KTV "rảnh" = chưa có lịch hẹn nào (PENDING/CONFIRMED) trong slot đó.
    /// </summary>
    [HttpGet("available-technicians")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<SlotTechnicianDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAvailableTechnicians(
        [FromQuery] string date,
        [FromQuery] string time,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(date))
            return BadRequest(new { message = "Query parameter 'date' is required (yyyy-MM-dd)." });
        if (string.IsNullOrWhiteSpace(time))
            return BadRequest(new { message = "Query parameter 'time' is required (HH:mm)." });

        try
        {
            var result = await _repairRequestService.GetAvailableTechniciansInSlotAsync(date, time, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
