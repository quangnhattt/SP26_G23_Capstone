using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MaintenanacePackage;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers
{
    [Route("api/maintenance-packages")]
    [ApiController]
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


    }
}
