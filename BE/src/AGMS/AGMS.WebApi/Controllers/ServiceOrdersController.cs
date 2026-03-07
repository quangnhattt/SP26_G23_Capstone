using AGMS.Application.Contracts;
using AGMS.Application.DTOs.ServiceOrder;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/service-orders")]
[Authorize]
public class ServiceOrdersController : ControllerBase
{
    private readonly ICarMaintenanceService _carMaintenanceService;

    public ServiceOrdersController(ICarMaintenanceService carMaintenanceService)
    {
        _carMaintenanceService = carMaintenanceService;
    }

    /// <summary>
    /// Lấy danh sách phiếu bảo dưỡng (service orders) cho màn hình staff.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ServiceOrderListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServiceOrders(CancellationToken ct)
    {
        var items = await _carMaintenanceService.GetServiceOrdersAsync(ct);
        return Ok(items);
    }

    [HttpGet("{maintenanceId:int}")]
    [ProducesResponseType(typeof(ServiceOrderIntakeDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetServiceOrderIntakeDetail(int maintenanceId, CancellationToken ct)
    {
        var detail = await _carMaintenanceService.GetServiceOrderIntakeDetailAsync(maintenanceId, ct);
        if (detail == null)
            return NotFound(new { message = "Service order not found." });

        return Ok(detail);
    }

    [HttpPost("walk-in")]
    [ProducesResponseType(typeof(WalkInServiceOrderCreateResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateWalkInServiceOrder([FromBody] WalkInServiceOrderCreateRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var createdByUserId = 0;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out var uid))
        {
            createdByUserId = uid;
        }

        try
        {
            var result = await _carMaintenanceService.CreateWalkInServiceOrderAsync(request, createdByUserId, ct);
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
}

