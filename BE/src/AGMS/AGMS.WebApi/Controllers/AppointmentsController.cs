using System.Security.Claims;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Appointments;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly CarServiceDbContext _db;

    public AppointmentsController(IAppointmentService appointmentService, CarServiceDbContext db)
    {
        _appointmentService = appointmentService;
        _db = db;
    }

    /// <summary>
    /// GET /api/appointments
    /// Customer: returns only their appointments.
    /// SA (RoleID = 2): returns all appointments.
    /// Supports optional query filters: status, fromDate, toDate, serviceType, carId, customerId (SA only).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppointmentListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetList(
        [FromQuery] AppointmentFilterDto filter,
        CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        var isSA = await IsServiceAdvisorAsync(userId, ct);

        var items = await _appointmentService.GetListAsync(userId, isSA, filter, ct);
        return Ok(items);
    }

    /// <summary>
    /// GET /api/appointments/{id}
    /// Customer: can only view their own appointment.
    /// SA (RoleID = 2): can view any appointment.
    /// Returns full detail including Car, Customer, Package, and CarMaintenance info.
    /// </summary>
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

    // ──────────────── helpers ────────────────

    private (int userId, IActionResult? error) ExtractUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(claim) || !int.TryParse(claim, out var uid))
            return (0, Unauthorized(new { message = "Invalid or missing user id claim." }));
        return (uid, null);
    }

    /// <summary>
    /// Look up the current user's RoleID from the database.
    /// RoleID == 2 → Service Advisor.
    /// </summary>
    private async Task<bool> IsServiceAdvisorAsync(int userId, CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.UserID == userId)
            .Select(u => new { u.RoleID })
            .FirstOrDefaultAsync(ct);

        return user?.RoleID == 2;
    }
}
