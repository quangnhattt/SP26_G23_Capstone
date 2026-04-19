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
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (roleIdClaim == "3" && int.TryParse(userIdClaim, out var techId)) 
        {
            employeeId = techId;
        }
        else if (roleIdClaim == "4" && int.TryParse(userIdClaim, out var custId))
        {
            query.CustomerId = custId;
        }

        var result = await _carMaintenanceService.GetServiceOrdersAsync(query, employeeId, ct);
        return Ok(result);
    }

    [HttpGet("customer-history")]
    [ProducesResponseType(typeof(ServiceOrderPagedResultDto<CustomerServiceHistoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCustomerHistory(
        [FromQuery] string? status, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        CancellationToken ct = default)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var customerId))
            return Unauthorized(new { message = "Invalid or missing user id claim." });

        var result = await _carMaintenanceService.GetCustomerHistoryAsync(customerId, status, page, pageSize, ct);
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
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMaintenanceInvoice(int id, CancellationToken ct)
    {
        try
        {
            var result = await _carMaintenanceService.GetMaintenanceInvoiceAsync(id, ct);
            if(result == null)
                return NotFound(new {message=$"Không tìm thấy phiếu bảo dưỡng với ID = {id}"});
            
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/invoice")]
    [ProducesResponseType(typeof(MaintenanceInvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateMaintenanceInvoice(int id, CancellationToken ct)
    {
        try
        {
            var result = await _carMaintenanceService.CreateMaintenanceInvoiceAsync(id, ct);
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy phiếu bảo dưỡng với ID = {id}." });

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdditionalItems(int id, CancellationToken ct)
    {
        var roleIdClaim = User.FindFirstValue(ClaimTypes.Role);
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int roleId = int.TryParse(roleIdClaim, out var r) ? r : 0;
        int userId = int.TryParse(userIdClaim, out var u) ? u : 0;

        try
        {
            var result = await _carMaintenanceService.GetAdditionalItemsAsync(id, userId, roleId, ct);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
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

    [HttpPatch("{id:int}/confirm-repair")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmRepairOrder(int id, CancellationToken ct)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var updatedByUserId))
            return Unauthorized(new { message = "Invalid or missing user id claim." });

        try
        {
            var success = await _carMaintenanceService.ConfirmRepairOrderAsync(id, updatedByUserId, ct);
            if (!success)
                return NotFound(new { message = $"Không tìm thấy phiếu bảo dưỡng với ID = {id}." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:int}/parts-export")]
    [ProducesResponseType(typeof(PartsExportListDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPartsExport(int id, CancellationToken ct)
    {
        var result = await _carMaintenanceService.GetPartsToExportAsync(id, ct);
        if (result == null)
            return NotFound(new { message = $"Không tìm thấy phiếu bảo dưỡng với ID = {id}." });

        return Ok(result);
    }

    [HttpPatch("{id:int}/finish-repair")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FinishRepair(int id, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var updatedByUserId))
            return Unauthorized(new { message = "Invalid or missing user id claim." });

        try
        {
            var success = await _carMaintenanceService.FinishRepairOrderAsync(id, updatedByUserId, ct);
            if (!success)
                return NotFound(new { message = $"Không tìm thấy phiếu bảo dưỡng với ID = {id}." });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/pay")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProcessPayment(int id, [FromBody] ProcessPaymentRequestDto request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var processedByUserId))
            return Unauthorized(new { message = "Invalid or missing user id claim." });

        try
        {
            var success = await _carMaintenanceService.ProcessPaymentAsync(id, request, processedByUserId, ct);
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

