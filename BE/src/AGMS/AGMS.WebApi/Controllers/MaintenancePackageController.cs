using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MaintenanacePackage;
using AGMS.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers
{
    [Route("api/maintenance-packages")]
    //[ApiController]
    public class MaintenancePackageController : ControllerBase
    {
        public readonly IMaintenancePackageService _maintenancePackageService;
        public MaintenancePackageController (IMaintenancePackageService maintenancePackageService)
        {
            _maintenancePackageService= maintenancePackageService;
        }
        [HttpGet("with-active-products")]
        [ProducesResponseType(typeof(IEnumerable<PackageWithProductsDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPackagesWithActiveProductDetails(CancellationToken ct)
        {
            var result=await _maintenancePackageService.GetPackagesWithActiveProductDetailsAsync(ct);
            return Ok(result);
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<MaintenancePackageListItemDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var result = await _maintenancePackageService.GetAllPackagesAsync(ct);
            return Ok(result);
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
    }
}
