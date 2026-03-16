using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Rescue;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/rescue-requests")]
public class RescueRequestController : ControllerBase
{
    private readonly IRescueRequestService _rescueService;

    public RescueRequestController(IRescueRequestService rescueService)
    {
        _rescueService = rescueService;
    }

    // POST /api/rescue-requests
    /// <summary>
    /// Khách hàng tạo yêu cầu cứu hộ (UC-RES-01 Step 1-2).
    /// Validate: BR-16 (địa chỉ + mô tả bắt buộc), xe thuộc sở hữu khách hàng.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateRescueRequestDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.CreateAsync(request, ct);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/rescue-requests
    /// <summary>
    /// SA lấy danh sách yêu cầu cứu hộ với bộ lọc (UC-RES-01 Step 3).
    /// Hỗ trợ phân trang qua query params page và pageSize.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RescueRequestListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList(
        [FromQuery] string? status,
        [FromQuery] string? rescueType,
        [FromQuery] int? customerId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct)
    {
        var result = await _rescueService.GetListAsync(status, rescueType, customerId, fromDate, toDate, ct);

        // Phân trang phía controller — nhất quán với pattern UsersController
        if (page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0)
        {
            var skip = (page.Value - 1) * pageSize.Value;
            result = result.Skip(skip).Take(pageSize.Value).ToList();
        }

        return Ok(result);
    }

    // GET /api/rescue-requests/{id}
    /// <summary>
    /// Xem chi tiết yêu cầu cứu hộ (UC-RES-01 Step 3-4).
    /// Dùng cho cả SA lẫn Customer.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDetail(int id, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.GetDetailAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // GET /api/rescue-requests/{id}/available-technicians
    /// <summary>
    /// SA lấy danh sách kỹ thuật viên khả dụng để tham chiếu khi đánh giá (UC-RES-01 Step 4, BR-28).
    /// Chỉ trả về technician có IsOnRescueMission = false và IsActive = true.
    /// </summary>
    [HttpGet("{id:int}/available-technicians")]
    [ProducesResponseType(typeof(IEnumerable<AvailableTechnicianDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAvailableTechnicians(int id, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.GetAvailableTechniciansAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // =========================================================================
    // UC-RES-02: Điều phối & Sửa ven đường
    // =========================================================================

    // PATCH /api/rescue-requests/{id}/assign-technician
    /// <summary>
    /// SA điều phối kỹ thuật viên cho rescue (UC-RES-02 Step 1-2).
    /// BR-17: chỉ SA. BR-18: PROPOSED_ROADSIDE → DISPATCHED. BR-28: technician rảnh. SMC03, SMC10.
    /// </summary>
    [HttpPatch("{id:int}/assign-technician")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTechnician(int id, [FromBody] AssignTechnicianDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.AssignTechnicianAsync(id, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-17: Không đúng role — SMC04
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18/BR-28: Trạng thái không hợp lệ hoặc technician đang bận
            return BadRequest(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/accept-job
    /// <summary>
    /// Technician nhận job và xác nhận đang trên đường (UC-RES-02 Step 3).
    /// BR-18: DISPATCHED → EN_ROUTE. SMC05.
    /// </summary>
    [HttpPatch("{id:int}/accept-job")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptJob(int id, [FromBody] TechnicianActionDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.AcceptJobAsync(id, request, ct);
            return Ok(result);
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

    // PATCH /api/rescue-requests/{id}/arrive
    /// <summary>
    /// Technician báo đã đến hiện trường xe (UC-RES-02 Step 4).
    /// BR-18: EN_ROUTE → ON_SITE. SMC05.
    /// </summary>
    [HttpPatch("{id:int}/arrive")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Arrive(int id, [FromBody] TechnicianActionDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.ArriveAsync(id, request, ct);
            return Ok(result);
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

    // PATCH /api/rescue-requests/{id}/customer-consent
    /// <summary>
    /// Ghi nhận chấp thuận/từ chối sửa chữa tại chỗ của khách hàng (UC-RES-02 Step 5, BR-RES-01).
    /// consentGiven=true → ON_SITE (tiếp tục). consentGiven=false → PROPOSED_TOWING (AF-02).
    /// </summary>
    [HttpPatch("{id:int}/customer-consent")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordCustomerConsent(int id, [FromBody] CustomerConsentDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.RecordConsentAsync(id, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/start-diagnosis
    /// <summary>
    /// Technician bắt đầu chẩn đoán tại hiện trường (UC-RES-02 Step 6).
    /// canRepairOnSite=true → tạo Repair Order (BR-07, BR-11), DIAGNOSING.
    /// canRepairOnSite=false → PROPOSED_TOWING (AF-01), release technician.
    /// </summary>
    [HttpPatch("{id:int}/start-diagnosis")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartDiagnosis(int id, [FromBody] StartDiagnosisDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.StartDiagnosisAsync(id, request, ct);
            return Ok(result);
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
            // BR-11: Xe đã có active RO — SMR11
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/rescue-requests/{id}/repair-items
    /// <summary>
    /// Ghi nhận vật tư/dịch vụ sử dụng khi sửa ven đường (UC-RES-02 Step 7, BR-20, SMC08).
    /// Mỗi lần gọi THÊM mới items. Lần đầu: DIAGNOSING → REPAIRING.
    /// </summary>
    [HttpPost("{id:int}/repair-items")]
    [ProducesResponseType(typeof(RepairItemsResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddRepairItems(int id, [FromBody] AddRepairItemsDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.AddRepairItemsAsync(id, request, ct);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (KeyNotFoundException ex)
        {
            // BR-20: Sản phẩm không tồn tại
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/complete-repair
    /// <summary>
    /// Technician hoàn thành sửa chữa và báo cáo SA (UC-RES-02 Step 8).
    /// Status: REPAIRING → REPAIR_COMPLETE. Release technician. SMC05.
    /// </summary>
    [HttpPatch("{id:int}/complete-repair")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteRepair(int id, [FromBody] CompleteRepairDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.CompleteRepairAsync(id, request, ct);
            return Ok(result);
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

    // =========================================================================
    // UC-RES-03: Dịch vụ kéo xe
    // =========================================================================

    // PATCH /api/rescue-requests/{id}/dispatch-towing
    /// <summary>
    /// SA điều phối dịch vụ kéo xe (UC-RES-03 C1).
    /// BR-17: chỉ SA. BR-18: PROPOSED_TOWING → TOWING_DISPATCHED. SMC05, SMC11.
    /// </summary>
    [HttpPatch("{id:int}/dispatch-towing")]
    [ProducesResponseType(typeof(TowingDispatchResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> DispatchTowing(int id, [FromBody] DispatchTowingDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.DispatchTowingAsync(id, request, ct);
            return Ok(new { data = result, message = "Dịch vụ kéo xe đã được điều phối. Đề xuất đã gửi đến khách hàng." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-17: Không đúng role SA
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Trạng thái không hợp lệ
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/accept-towing
    /// <summary>
    /// Customer chấp nhận dịch vụ kéo xe (UC-RES-03 C2).
    /// BR-18: TOWING_DISPATCHED → TOWING_ACCEPTED.
    /// AF-01: Customer từ chối → gọi cancel endpoint (UC-RES-06).
    /// </summary>
    [HttpPatch("{id:int}/accept-towing")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AcceptTowing(int id, [FromBody] AcceptTowingDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.AcceptTowingAsync(id, request, ct);
            return Ok(new { data = result, message = "Khách hàng đã chấp nhận dịch vụ kéo xe." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // Không đúng khách hàng sở hữu rescue
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Trạng thái không hợp lệ
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/complete-towing
    /// <summary>
    /// SA hoàn tất kéo xe và tạo Repair Order tự động (UC-RES-03 C3).
    /// BR-19: tạo CarMaintenance RESCUE_TOWING. BR-18: TOWING_ACCEPTED → TOWED. BR-11: no active RO. SMC07.
    /// </summary>
    [HttpPatch("{id:int}/complete-towing")]
    [ProducesResponseType(typeof(CompleteTowingResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CompleteTowing(int id, [FromBody] CompleteTowingDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.CompleteTowingAsync(id, request, ct);
            return Ok(new
            {
                data    = result,
                message = $"Xe đã được kéo về. Repair Order #{result.ResultingMaintenance?.MaintenanceId} đã được tạo."
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-17: Không đúng role SA
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-11: Xe đã có active RO — SMR11 | BR-18: Trạng thái không hợp lệ
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // =========================================================================
    // UC-RES-04: Hóa đơn & Thanh toán
    // =========================================================================

    // POST /api/rescue-requests/{id}/invoice
    /// <summary>
    /// SA tạo hóa đơn cứu hộ (UC-RES-04 D1).
    /// BR-17: chỉ SA. BR-18: REPAIR_COMPLETE | TOWED → INVOICED.
    /// BR-24: tự động tính member discount. SMP02, SMP06.
    /// </summary>
    [HttpPost("{id:int}/invoice")]
    [ProducesResponseType(typeof(CreateInvoiceResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateInvoice(int id, [FromBody] CreateInvoiceDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.CreateInvoiceAsync(id, request, ct);
            return StatusCode(StatusCodes.Status201Created,
                new { data = result, message = "Hóa đơn đã được tạo thành công." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-17: Không đúng role SA | manualDiscount > baseAmount
            return ex.Message.Contains("Service Advisor")
                ? StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Trạng thái không hợp lệ
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // GET /api/rescue-requests/{id}/invoice
    /// <summary>
    /// Lấy thông tin hóa đơn và danh sách vật tư/dịch vụ (UC-RES-04 D2).
    /// Actor: SA hoặc Customer.
    /// </summary>
    [HttpGet("{id:int}/invoice")]
    [ProducesResponseType(typeof(InvoiceWithItemsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> GetInvoice(int id, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.GetInvoiceAsync(id, ct);
            return Ok(new { data = result, message = "Success" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/invoice/send
    /// <summary>
    /// SA gửi hóa đơn cho Customer (UC-RES-04 D3).
    /// BR-17: chỉ SA. BR-18: INVOICED → INVOICE_SENT. BR-25: bảo mật tài chính. SMC05.
    /// </summary>
    [HttpPatch("{id:int}/invoice/send")]
    [ProducesResponseType(typeof(SendInvoiceResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> SendInvoice(int id, [FromBody] SendInvoiceDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.SendInvoiceAsync(id, request, ct);
            return Ok(new { data = result, message = "Hóa đơn đã được gửi đến khách hàng." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-17: Không đúng role SA
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Trạng thái không hợp lệ
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/invoice/accept
    /// <summary>
    /// Customer chấp nhận hóa đơn (UC-RES-04 D4).
    /// BR-18: INVOICE_SENT → PAYMENT_PENDING.
    /// AF-01: Customer khiếu nại → gọi dispute endpoint (UC-RES-05).
    /// </summary>
    [HttpPatch("{id:int}/invoice/accept")]
    [ProducesResponseType(typeof(AcceptInvoiceResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AcceptInvoice(int id, [FromBody] AcceptInvoiceDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.AcceptInvoiceAsync(id, request, ct);
            return Ok(new { data = result, message = "Hóa đơn đã được chấp nhận. Vui lòng tiến hành thanh toán." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // Không đúng khách hàng sở hữu rescue
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Trạng thái không hợp lệ
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // POST /api/rescue-requests/{id}/invoice/payment
    /// <summary>
    /// Customer thanh toán (UC-RES-04 D5).
    /// BR-23: ghi nhận giao dịch. BR-18: PAYMENT_PENDING → COMPLETED.
    /// Validate: amount khớp finalAmount (BR-23), method hợp lệ (SMP07). SMP03, SMP05.
    /// </summary>
    [HttpPost("{id:int}/invoice/payment")]
    [ProducesResponseType(typeof(PaymentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ProcessPayment(int id, [FromBody] ProcessPaymentDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.ProcessPaymentAsync(id, request, ct);
            return Ok(new { data = result, message = "Thanh toán thành công. Cảm ơn bạn đã sử dụng dịch vụ." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // Sai customer ownership hoặc số tiền không khớp (BR-23)
            return ex.Message.Contains("không phải khách hàng")
                ? StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // SMP07: Phương thức không hợp lệ | BR-18: Trạng thái không hợp lệ
            return ex.Message.Contains("không được hỗ trợ")
                ? UnprocessableEntity(new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
    }

    // =========================================================================
    // UC-RES-05: Tranh chấp hóa đơn
    // =========================================================================

    // POST /api/rescue-requests/{id}/invoice/dispute
    /// <summary>
    /// Customer tạo khiếu nại hóa đơn (UC-RES-05 E1).
    /// BR-18: INVOICE_SENT → INVOICE_DISPUTED. BR-26: audit. SMC12.
    /// </summary>
    [HttpPost("{id:int}/invoice/dispute")]
    [ProducesResponseType(typeof(DisputeCreatedResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateDispute(int id, [FromBody] CreateDisputeDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.CreateDisputeAsync(id, request, ct);
            return StatusCode(StatusCodes.Status201Created,
                new { data = result, message = "Khiếu nại đã được ghi nhận. SA sẽ xem xét và phản hồi." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-03: Không phải customer của rescue này
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Trạng thái không hợp lệ
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/invoice/resolve-dispute
    /// <summary>
    /// SA xử lý tranh chấp và gửi lại hóa đơn (UC-RES-05 E2).
    /// BR-17: chỉ SA. BR-18: INVOICE_DISPUTED → INVOICE_SENT. BR-26: audit.
    /// reissue=true: phát hành hóa đơn điều chỉnh. reissue=false: gửi lại hóa đơn cũ.
    /// </summary>
    [HttpPatch("{id:int}/invoice/resolve-dispute")]
    [ProducesResponseType(typeof(ResolveDisputeResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ResolveDispute(int id, [FromBody] ResolveDisputeDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.ResolveDisputeAsync(id, request, ct);
            var message = result.Invoice.IsReissued
                ? "Tranh chấp đã được xử lý. Hóa đơn điều chỉnh đã được gửi lại cho khách hàng."
                : "Tranh chấp đã được xem xét. Hóa đơn gốc đã được gửi lại.";
            return Ok(new { data = result, message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-17: Không đúng role SA | AdjustedServiceFee validation
            return ex.Message.Contains("Service Advisor")
                ? StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Trạng thái không hợp lệ
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // =========================================================================
    // UC-RES-06: Hủy / Spam
    // =========================================================================

    // PATCH /api/rescue-requests/{id}/cancel
    /// <summary>
    /// SA hủy yêu cầu cứu hộ (UC-RES-06 F1).
    /// BR-18: không hủy khi COMPLETED/CANCELLED. BR-26: audit. SMC06.
    /// Side effects: release technician, cancel CarMaintenance nếu có.
    /// </summary>
    [HttpPatch("{id:int}/cancel")]
    [ProducesResponseType(typeof(CancelRescueResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelRescueDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.CancelAsync(id, request, ct);
            return Ok(new { data = result, message = "Yêu cầu cứu hộ đã bị hủy." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-03: Không đúng role SA
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Không thể hủy (COMPLETED hoặc đã CANCELLED)
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/mark-spam
    /// <summary>
    /// SA/System đánh dấu Spam yêu cầu cứu hộ (UC-RES-06 F2, AF-01).
    /// BR-18: chỉ PENDING | REVIEWING. BR-26: audit. SMC14, SMC06.
    /// Flow: PENDING/REVIEWING → SPAM → CANCELLED.
    /// </summary>
    [HttpPatch("{id:int}/mark-spam")]
    [ProducesResponseType(typeof(MarkSpamResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> MarkSpam(int id, [FromBody] MarkSpamDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.MarkSpamAsync(id, request, ct);
            return Ok(new { data = result, message = "Yêu cầu đã bị đánh dấu Spam và hủy." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-03: Không đúng role SA
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Không đúng trạng thái PENDING/REVIEWING
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/propose
    /// <summary>
    /// SA gửi đề xuất sửa tại chỗ hoặc kéo xe cho khách hàng (UC-RES-01 Step 5-6).
    /// BR-17: Chỉ SA được gửi đề xuất.
    /// BR-18: Status phải là PENDING hoặc REVIEWING.
    /// Status transition: → PROPOSED_ROADSIDE hoặc PROPOSED_TOWING.
    /// </summary>
    [HttpPatch("{id:int}/propose")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Propose(int id, [FromBody] ProposeRescueDto request, CancellationToken ct)
    {
        try
        {
            var result = await _rescueService.ProposeAsync(id, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // BR-17: Không đúng role SA
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // BR-18: Trạng thái không hợp lệ cho thao tác này
            return BadRequest(new { message = ex.Message });
        }
    }
}
