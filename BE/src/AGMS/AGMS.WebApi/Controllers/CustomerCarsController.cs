using System.Security.Claims;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.RepairRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/customer/cars")]
[Authorize]
public class CustomerCarsController : ControllerBase
{
    private readonly IRepairRequestService _repairRequestService;

    public CustomerCarsController(IRepairRequestService repairRequestService)
    {
        _repairRequestService = repairRequestService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CustomerCarListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCustomerCars(CancellationToken ct)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing user id claim." });
        }

        var cars = await _repairRequestService.GetCustomerCarsAsync(userId, ct);
        return Ok(cars);
    }
}

