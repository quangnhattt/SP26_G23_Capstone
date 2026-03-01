using System.Security.Claims;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.RepairRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/services")]
[Authorize]
public class ServicesController : ControllerBase
{
    private readonly IRepairRequestService _repairRequestService;

    public ServicesController(IRepairRequestService repairRequestService)
    {
        _repairRequestService = repairRequestService;
    }

    // GET /api/services?serviceType=maintenance&carId=123
    [HttpGet]
    [ProducesResponseType(typeof(ServiceSelectionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetServices(
        [FromQuery] string? serviceType,
        [FromQuery] int? carId,
        CancellationToken ct)
    {
        // We don't currently need the userId, but Authorize ensures a valid token.
        _ = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var result = await _repairRequestService.GetServicesAsync(serviceType, carId, ct);
        return Ok(result);
    }
}

