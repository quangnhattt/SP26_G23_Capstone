using AGMS.Application.Contracts;
using AGMS.Application.DTOs.ServiceOrder;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(MaintenancePrintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMaintenancePrint(int id, CancellationToken ct)
    {
        var result = await _carMaintenanceService.GetMaintenancePrintAsync(id, ct);

        if (result == null)
            return NotFound(new { message = $"Không tìm thấy phiếu bảo dưỡng với ID = {id}." });

        return Ok(result);
    }
}

