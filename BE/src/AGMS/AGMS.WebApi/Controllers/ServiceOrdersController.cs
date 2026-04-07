using System.Security.Claims;
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
    [ProducesResponseType(typeof(ServiceOrderPagedResultDto<ServiceOrderListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServiceOrders([FromQuery] ServiceOrderListQueryDto query, CancellationToken ct)
    {
        int? employeeId = null;
        var roleIdClaim = User.FindFirstValue(ClaimTypes.Role);
        
        if (roleIdClaim == "3") 
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out var userId))
            {
                employeeId = userId;
            }
        }

        var result = await _carMaintenanceService.GetServiceOrdersAsync(query, employeeId, ct);
        return Ok(result);
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
    [HttpGet("{id:int}/invoice")]
    [ProducesResponseType(typeof(MaintenanceInvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMaintenanceInvoice(int id, CancellationToken ct)
    {
        var result=await _carMaintenanceService.GetMaintenanceInvoiceAsync(id, ct);
        if(result== null)
        
            return NotFound(new {message=$"Không tìm thấy phiếu bảo dưỡng vơi ID= {id}"});
        return Ok(result);
    }

    [HttpPost("{id:int}/invoice")]
    [ProducesResponseType(typeof(MaintenanceInvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateMaintenanceInvoice(int id, CancellationToken ct)
    {
        var result = await _carMaintenanceService.CreateMaintenanceInvoiceAsync(id, ct);

        if (result == null)
            return NotFound(new { message = $"Không tìm thấy phiếu bảo dưỡng với ID = {id}." });

        return Ok(result);
    }

    [HttpPost("{id:int}/additional-items")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProposeAdditionalItems(int id, [FromBody] ProposeAdditionalItemsRequest request, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        try
        {
            await _carMaintenanceService.ProposeAdditionalItemsAsync(id, request, ct);
            return NoContent();
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
    [HttpGet("{id:int}/additional-items")]
    [ProducesResponseType(typeof(AdditionalItemsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdditionalItems(int id, CancellationToken ct)
    {
        try
        {
            var result = await _carMaintenanceService.GetAdditionalItemsAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
    [HttpPatch("{id:int}/additional-items/respond")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RespondToAdditionalItems(
        int id,
        [FromBody] RespondAdditionalItemsRequest request,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            await _carMaintenanceService.RespondToAdditionalItemsAsync(id, request, ct);
            return NoContent();
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

    [HttpPatch("{id:int}/assign-technician")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTechnician(int id, [FromBody] TechnicianAssignmentRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var success = await _carMaintenanceService.AssignTechnicianAsync(id, request.TechnicianId, ct);
            if (!success)
                return NotFound(new { message = $"Không tìm thấy phiếu bảo dưỡng với ID = {id}." });

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/start-diagnosis")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartDiagnosis(int id, CancellationToken ct)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var updatedByUserId))
            return Unauthorized(new { message = "Invalid or missing user id claim." });

        try
        {
            var success = await _carMaintenanceService.StartDiagnosisAsync(id, updatedByUserId, ct);
            if (!success)
                return NotFound(new { message = $"Không tìm thấy phiếu bảo dưỡng với ID = {id}." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

}

