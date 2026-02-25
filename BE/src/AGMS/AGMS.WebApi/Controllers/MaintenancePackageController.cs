using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MaintenanacePackage;
using AGMS.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[Route("api/maintenance-packages")]
public class MaintenancePackageController : ControllerBase
{
    private readonly IMaintenancePackageService _maintenancePackageService;

    public MaintenancePackageController(IMaintenancePackageService maintenancePackageService)
    {
        _maintenancePackageService = maintenancePackageService;
    }

    [HttpGet("{packageId:int}/details")]
    [ProducesResponseType(typeof(MaintenancePackageDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPackageDetails(int packageId, CancellationToken ct)
    {
        try
        {
            var result = await _maintenancePackageService.GetByIdWithActiveProductsAsync(packageId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("{packageId:int}")]
    [ProducesResponseType(typeof(MaintenancePackageByIdDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int packageId, CancellationToken ct)
    {
        try
        {
            var result = await _maintenancePackageService.GetByIdAsync(packageId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MaintenancePackageListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, CancellationToken ct = default)
    {
        const int pageSize = 20;
        if (page < 1) page = 1;

        var allItems = await _maintenancePackageService.GetAllPackagesAsync(ct);
        var skip = (page - 1) * pageSize;
        var paged = allItems.Skip(skip).Take(pageSize);

        return Ok(paged);
    }

    [HttpPost]
    [ProducesResponseType(typeof(MaintenancePackageListItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateMaintenancePackageRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            var firstError = ModelState.Values
                .SelectMany(v => v.Errors)
                .FirstOrDefault()?.ErrorMessage
                ?? "Validation failed.";
            return BadRequest(new { message = firstError });
        }

        try
        {
            var result = await _maintenancePackageService.CreateAsync(request, ct);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (ConflictException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{packageId:int}")]
    [ProducesResponseType(typeof(MaintenancePackageByIdDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int packageId, [FromBody] UpdateMaintenancePackageRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            var firstError = ModelState.Values
                .SelectMany(v => v.Errors)
                .FirstOrDefault()?.ErrorMessage
                ?? "Validation failed.";
            return BadRequest(new { message = firstError });
        }

        try
        {
            var result = await _maintenancePackageService.UpdateAsync(packageId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ConflictException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{packageId:int}/active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PatchStatus(int packageId, CancellationToken ct)
    {
        try
        {
            await _maintenancePackageService.SetActiveStatusAsync(packageId, true, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{packageId:int}/inactive")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PatchInactive(int packageId, CancellationToken ct)
    {
        try
        {
            await _maintenancePackageService.SetActiveStatusAsync(packageId, false, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
