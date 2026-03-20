using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Inventory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc đăng nhập
    public class InventoryController : ControllerBase
    {
        // INJECT SERVICE
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // API 1: LẬP PHIẾU NHẬP KHO
        [HttpPost("import")]
        [Authorize(Roles = Roles.Admin)]// Khóa cứng chỉ Admin
        public async Task<IActionResult> CreateGoodsReceipt([FromBody] CreateGoodsReceiptDto request, CancellationToken ct)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int loggedInUserId))
                    return Unauthorized(new { message = "Token không hợp lệ." });

                await _inventoryService.ProcessGoodsReceiptAsync(loggedInUserId, request, ct);

                return Ok(new { message = "Lập phiếu nhập kho và cập nhật tồn kho thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    detail = ex.InnerException?.Message
                });
            }
        }

        // API 2: XUẤT KHO SỬA CHỮA
        [HttpPost("issue")]
        public async Task<IActionResult> IssueStock([FromBody] IssueStockDto request, CancellationToken ct)
        {
            try
            {
                await _inventoryService.ProcessStockIssueAsync(
                    request.ProductId,
                    request.TransferOrderId,
                    request.Quantity,
                    request.Note,
                    ct);

                return Ok(new { message = "Xuất kho thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // API 2.1: TẠO PHIẾU XUẤT TỪ SERVICE ORDER
        [HttpPost("service-orders/{maintenanceId:int}/transfer-order")]
        public async Task<IActionResult> CreateIssueTransferOrderFromServiceOrder(int maintenanceId, CancellationToken ct)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int loggedInUserId))
                    return Unauthorized(new { message = "Token không hợp lệ." });

                var result = await _inventoryService.CreateIssueTransferOrderFromServiceOrderAsync(
                    maintenanceId,
                    loggedInUserId,
                    ct);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    detail = ex.InnerException?.Message,
                    inner = ex.InnerException?.InnerException?.Message
                });
            }
        }

        // API 3: KIỂM TOÁN KHO
        [HttpGet("audit-discrepancies")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AuditInventory(CancellationToken ct)
        {
            var discrepancies = await _inventoryService.AuditInventoryAsync(ct);

            if (!discrepancies.Any())
            {
                return Ok(new { message = "Tuyệt vời! Dữ liệu Sổ cái và Tồn kho khớp nhau 100%.", data = discrepancies });
            }

            return Ok(new
            {
                message = "CẢNH BÁO: Phát hiện sai lệch dữ liệu!",
                data = discrepancies
            });
        }
    }
}