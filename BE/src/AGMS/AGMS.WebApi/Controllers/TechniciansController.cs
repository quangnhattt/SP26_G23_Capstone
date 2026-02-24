using AGMS.Application.Contracts;
using AGMS.Application.DTOs.RepairRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/technicians")]
[Authorize]
public class TechniciansController : ControllerBase
{
    private readonly IRepairRequestService _repairRequestService;

    public TechniciansController(IRepairRequestService repairRequestService)
    {
        _repairRequestService = repairRequestService;
    }

    // GET /api/technicians?serviceId=1 or /api/technicians?serviceIds=1&serviceIds=2
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TechnicianListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTechnicians(
        [FromQuery] int? serviceId,
        [FromQuery] List<int>? serviceIds,
        CancellationToken ct)
    {
        IEnumerable<int>? allServiceIds = null;
        if (serviceId.HasValue)
        {
            allServiceIds = new List<int> { serviceId.Value };
        }
        if (serviceIds != null && serviceIds.Count > 0)
        {
            allServiceIds = allServiceIds == null
                ? serviceIds
                : allServiceIds.Concat(serviceIds).Distinct().ToList();
        }

        var technicians = await _repairRequestService.GetTechniciansAsync(allServiceIds, ct);
        return Ok(technicians);
    }
}

