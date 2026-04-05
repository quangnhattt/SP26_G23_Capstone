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
    [Authorize] // Bắt buộc đăng nhập cho toàn bộ Controller
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // API 1: LẬP PHIẾU NHẬP KHO (Dành cho Admin)
        [HttpPost("import")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> CreateGoodsReceipt([FromBody] CreateGoodsReceiptDto request, CancellationToken ct)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int loggedInUserId))
                    return Unauthorized(new { message = "Token không hợp lệ hoặc đã hết hạn." });

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

        // API 2: TẠO PHIẾU XUẤT TỪ HÓA ĐƠN DỊCH VỤ (Service Advisor tạo)
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
                    detail = ex.InnerException?.Message
                });
            }
        }

        // API 3: THỰC XUẤT KHO TOÀN BỘ THEO PHIẾU (Thủ kho / Kỹ thuật viên thao tác)
        [HttpPost("issue/{transferOrderId:int}")]
        // Không cần [Authorize] nữa vì đã có ở mức Class
        public async Task<IActionResult> ApproveIssueOrder(int transferOrderId, CancellationToken ct)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { message = "Token không hợp lệ." });

                // Đã sửa thành _inventoryService theo đúng tên Inject
                await _inventoryService.ProcessStockIssueAsync(transferOrderId, userId, ct);

                return Ok(new { message = "Xuất kho thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // API 4: KIỂM TOÁN KHO
        [HttpGet("audit-discrepancies")]
        [Authorize(Roles = Roles.Admin)] // Sửa lại dùng hằng số cho chuẩn
        public async Task<IActionResult> AuditInventory(CancellationToken ct)
        {
            try
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
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // API 5: XEM LỊCH SỬ GIAO DỊCH KHO (SỔ CÁI)
        [HttpGet("transactions")]
        [Authorize(Roles = Roles.Admin)] // Chỉ Admin mới được xem
        public async Task<IActionResult> GetTransactionHistory([FromQuery] InventoryTransactionFilterDto filter, CancellationToken ct)
        {
            try
            {
                var result = await _inventoryService.GetTransactionHistoryAsync(filter, ct);
                return Ok(new
                {
                    message = "Lấy lịch sử giao dịch thành công",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // API 6: KIỂM KÊ KHO VÀ ĐIỀU CHỈNH
        [HttpPost("adjust")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> AdjustStock([FromBody] InventoryAdjustmentDto request, CancellationToken ct)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int loggedInUserId))
                    return Unauthorized(new { message = "Token không hợp lệ." });

                await _inventoryService.AdjustStockAsync(loggedInUserId, request, ct);

                return Ok(new { message = "Kiểm kê vật lý và điều chỉnh kho thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // API 7: ĐỒNG BỘ LẠI TỒN KHO TỪ SỔ CÁI (DÀNH CHO FIX BUG/ADMIN)
        [HttpPost("rebuild-balances")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> RebuildInventoryBalances(CancellationToken ct)
        {
            try
            {
                await _inventoryService.RebuildInventoryBalancesAsync(ct);
                return Ok(new { message = "Đồng bộ lại toàn bộ dữ liệu Tồn kho (Snapshot) dựa trên Lịch sử giao dịch (Ledger) thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
            }
        }
    }
}