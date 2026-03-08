using System.Security.Claims;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.RepairRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/repair-requests")]
[Authorize]
public class RepairRequestsController : ControllerBase
{
    private readonly IRepairRequestService _repairRequestService;

    public RepairRequestsController(IRepairRequestService repairRequestService)
    {
        _repairRequestService = repairRequestService;
    }

    // POST /api/repair-requests/preview
    [HttpPost("preview")]
    [ProducesResponseType(typeof(RepairRequestPreviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Preview([FromBody] RepairRequestCreateRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing user id claim." });
        }

        try
        {
            var preview = await _repairRequestService.PreviewAsync(request, userId, ct);
            return Ok(preview);
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

    // POST /api/repair-requests
    [HttpPost]
    [ProducesResponseType(typeof(RepairRequestDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] RepairRequestCreateRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing user id claim." });
        }

        try
        {
            var created = await _repairRequestService.CreateAsync(request, userId, ct);
            return StatusCode(StatusCodes.Status201Created, created);
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
}

