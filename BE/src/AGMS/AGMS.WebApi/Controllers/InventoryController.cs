using AGMS.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
     
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var result = await _inventoryService.GetDashboardDataAsync();
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống khi tải dữ liệu kho.", details = ex.Message });
            }
        }
    }
}