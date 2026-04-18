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

        // ============================================================
        // API 8: TECH XEM DANH SÁCH PHIẾU XUẤT KHO CỦA MÌNH
        // - Chỉ cho role Technician (Role = 3)
        // - Lọc theo: đơn sửa chữa nào có AssignedTechnicianID == userId đang đăng nhập
        // - Tech chỉ thấy phiếu ISSUE thuộc về đơn mình được phân công
        // ============================================================
        [HttpGet("my-transfer-orders")]
        [Authorize(Roles = Roles.Technician)]
        public async Task<IActionResult> GetMyTransferOrders(CancellationToken ct)
        {
            try
            {
                // Lấy userId từ JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int loggedInUserId))
                    return Unauthorized(new { message = "Token không hợp lệ hoặc đã hết hạn." });

                var result = await _inventoryService.GetMyTransferOrdersAsync(loggedInUserId, ct);

                return Ok(new
                {
                    message = $"Lấy danh sách phiếu xuất kho thành công. Tìm thấy {result.Count} phiếu.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // ============================================================
        // API 9: ADMIN/SA XEM TOÀN BỘ TRANSFER ORDER KÈM CHI TIẾT LINH KIỆN
        // - Cho phép Admin (Role = 1) và ServiceAdvisor (Role = 2)
        // - Hỗ trợ filter: Type, Status, MaintenanceId, TechnicianId
        // - Phân trang: PageIndex, PageSize
        // ============================================================
        [HttpGet("transfer-orders")]
        [Authorize(Roles = Roles.Admin + "," + Roles.ServiceAdvisor)]
        public async Task<IActionResult> GetAllTransferOrdersWithDetails(
            [FromQuery] TransferOrderFilterDto filter, CancellationToken ct)
        {
            try
            {
                var result = await _inventoryService.GetAllTransferOrdersWithDetailsAsync(filter, ct);

                return Ok(new
                {
                    message = "Lấy danh sách Transfer Order thành công.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // ============================================================
        // API 10: TỰ ĐỘNG QUÉT VÀ TẠO PHIẾU HOÀN TRẢ LÌNH KIỆN DƯ (DRAFT)
        // Hệ thống sẽ tìm TẤT CẢ các ca cứu hộ có chênh lệch và lên danh sách phiếu nháp
        // ============================================================
        [HttpPost("auto-surplus-return")]
        [Authorize(Roles = Roles.Technician + "," + Roles.Admin + "," + Roles.ServiceAdvisor)]
        public async Task<IActionResult> AutoDetectSurplusReturnDrafts(CancellationToken ct)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int loggedInUserId))
                    return Unauthorized(new { message = "Token không hợp lệ." });

                var scanResult = await _inventoryService.AutoDetectAndCreateSurplusReturnsAsync(loggedInUserId, ct);

                if (!scanResult.DraftIds.Any() && !scanResult.Errors.Any())
                {
                    return Ok(new { message = "Hệ thống đã quét và không tìm thấy linh kiện nào dư thừa." });
                }

                if (!scanResult.DraftIds.Any() && scanResult.Errors.Any())
                {
                    return Ok(new { 
                        message = "Không thể tạo phiếu nháp nào do dữ liệu hiện tại có bất thường.", 
                        warning = "Có một số ca cứu hộ bị lỗi lệch dữ liệu thực tế so với sổ cái.",
                        errors = scanResult.Errors
                    });
                }

                return Ok(new { 
                    message = $"Đã tự động lên {scanResult.DraftIds.Count} phiếu nháp yêu cầu hoàn trả linh kiện dư!", 
                    transferOrderIds = scanResult.DraftIds,
                    errors = scanResult.Errors.Any() ? scanResult.Errors : null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ============================================================
        // API 11: THỦ KHO XÁC NHẬN NHẬP KHO LẠI HÀNG DƯ (APPROVE RETURN)
        // Cộng thẳng tồn kho, bỏ qua xét AverageCost
        // ============================================================
        [HttpPost("returns/{transferOrderId:int}/approve")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> ApproveSurplusReturn(int transferOrderId, CancellationToken ct)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out int loggedInUserId))
                    return Unauthorized(new { message = "Token không hợp lệ." });

                await _inventoryService.ApproveSurplusReturnAsync(transferOrderId, loggedInUserId, ct);

                return Ok(new { message = "Đã xác nhận nhập kho linh kiện trả lại thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ============================================================
        // API 12: XEM DANH SÁCH CÁC PHIẾU HOÀN TRẢ LINH KIỆN
        // Trả về danh sách các phiếu RETURN (nháp hoặc đã duyệt)
        // ============================================================
        [HttpGet("returns")]
        [Authorize(Roles = Roles.Admin + "," + Roles.ServiceAdvisor)]
        public async Task<IActionResult> GetAllReturnTransferOrders(
            [FromQuery] TransferOrderFilterDto filter, CancellationToken ct)
        {
            try
            {
                // Bắt buộc filter Type = "RETURN" để chỉ lấy các phiếu do Auto Detect tạo ra
                filter.Type = "RETURN";
                var result = await _inventoryService.GetAllTransferOrdersWithDetailsAsync(filter, ct);

                return Ok(new
                {
                    message = "Lấy danh sách phiếu hoàn trả linh kiện dư thành công.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}