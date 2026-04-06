using System.Security.Claims;
using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Rescue;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/rescue-requests")]
[Authorize]
public class RescueRequestController : ControllerBase
{
    private readonly IRescueRequestService _rescueService;

    public RescueRequestController(IRescueRequestService rescueService)
    {
        _rescueService = rescueService;
    }

    // =========================================================================
    // API Taoj đơn cứu hộ cho Khách Hàng
    // =========================================================================

    // POST /api/rescue-requests
    /// <summary>
    /// Khách hàng tạo yêu cầu cứu hộ (UC-RES-01 Step 1-2). BR-16.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Admin + "," + Roles.ServiceAdvisor + "," + Roles.Customer)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        [FromBody] CreateRescueRequestDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.CreateAsync(userId, request, ct);
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

    // POST /api/rescue-requests/{id}/deposit
    // Sau khi khách hàng đồng ý đề xuất, khách mới hoặc có điểm tin cậy thấp dùng endpoint này để mở khóa bước điều phối.
    [HttpPost("{id:int}/deposit")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(RescueDepositResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> PayDeposit(
        int id,
        [FromBody] PayRescueDepositDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.PayDepositAsync(id, userId, request, ct);
            return Ok(
                new
                {
                    data = result,
                    message = "Khách hàng đã gửi thông tin đặt cọc, đang chờ SA xác nhận."
                }
            );
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
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/deposit/confirm
    /// <summary>
    /// Service Advisor xác nhận đã nhận tiền hoặc chứng từ đặt cọc từ khách hàng.
    /// Chỉ sau bước này, yêu cầu cần đặt cọc mới được mở khóa để tiếp tục điều phối.
    /// </summary>
    [HttpPatch("{id:int}/deposit/confirm")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(RescueDepositResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ConfirmDeposit(int id, CancellationToken ct)
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.ConfirmDepositAsync(id, userId, ct);
            return Ok(new { data = result, message = "SA đã xác nhận nhận cọc." });
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
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // GET /api/rescue-requests
    /// <summary>
    /// Lấy danh sách yêu cầu cứu hộ (UC-RES-01 Step 3).
    /// Customer chỉ thấy yêu cầu của mình (auto-filter theo token).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RescueRequestListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetList(
        [FromQuery] string? status,
        [FromQuery] string? rescueType,
        [FromQuery] int? customerId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct
    )
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        // Customer chỉ được xem rescue của chính mình
        if (IsRole(Roles.Customer))
            customerId = userId;

        var result = await _rescueService.GetListAsync(
            status,
            rescueType,
            customerId,
            fromDate,
            toDate,
            ct
        );

        if (page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0)
        {
            var skip = (page.Value - 1) * pageSize.Value;
            result = result.Skip(skip).Take(pageSize.Value).ToList();
        }

        return Ok(result);
    }

    // GET /api/rescue-requests/{id}
    /// <summary>
    /// Xem chi tiết yêu cầu cứu hộ (UC-RES-01 Step 3-4). Dùng cho cả SA lẫn Customer.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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
    /// SA xem danh sách kỹ thuật viên khả dụng (UC-RES-01 Step 4, BR-28).
    /// </summary>
    [HttpGet("{id:int}/available-technicians")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(IEnumerable<AvailableTechnicianDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
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

    // PATCH /api/rescue-requests/{id}/propose
    /// <summary>
    /// SA gửi đề xuất sửa tại chỗ hoặc kéo xe (UC-RES-01 Step 5-6). BR-17, BR-18.
    /// Sau bước này, khách hàng phải gọi /accept-proposal trước khi đóng cọc hoặc điều phối.
    /// </summary>
    ///
    /// Lưu ý DB: cần bổ sung PROPOSAL_ACCEPTED vào CK_Rescue_Status nếu DB đang dùng check constraint cho cột Status.
    [HttpPatch("{id:int}/propose")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Propose(
        int id,
        [FromBody] ProposeRescueDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // SuggestedParts cho phép FE gửi sớm danh sách phụ tùng dự kiến kèm số lượng ngay ở bước đề xuất.

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.ProposeAsync(id, userId, request, ct);
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
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // =========================================================================
    // UC-RES-02: Điều phối & Sửa ven đường
    // =========================================================================

    // PATCH /api/rescue-requests/{id}/accept-proposal
    /// <summary>
    /// Khách hàng chấp nhận đề xuất của SA. Không cần body.
    /// PROPOSED_ROADSIDE/PROPOSED_TOWING → PROPOSAL_ACCEPTED.
    /// </summary>
    [HttpPatch("{id:int}/accept-proposal")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AcceptProposal(int id, CancellationToken ct)
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.AcceptProposalAsync(id, userId, ct);
            return Ok(
                new
                {
                    data = result,
                    message = "Khách hàng đã đồng ý đề xuất. Nếu yêu cầu cần đặt cọc thì khách hàng có thể đóng cọc từ bước này."
                }
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/assign-technician
    /// <summary>
    /// SA điều phối kỹ thuật viên (UC-RES-02 Step 1-2). BR-17, BR-18, BR-28. SMC03, SMC10.
    /// Chỉ gọi sau khi khách hàng đã chấp nhận đề xuất và đã đóng cọc nếu yêu cầu có bắt buộc đặt cọc.
    /// Body: chỉ cần technicianId và estimatedArrivalDateTime.
    /// </summary>
    [HttpPatch("{id:int}/assign-technician")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AssignTechnician(
        int id,
        [FromBody] AssignTechnicianDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.AssignTechnicianAsync(id, userId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return ex.Message.Contains("nhiệm vụ cứu hộ")
                ? Conflict(new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/accept-job
    /// <summary>
    /// Technician nhận job (UC-RES-02 Step 3). Không cần body. BR-18: DISPATCHED → EN_ROUTE.
    /// </summary>
    [HttpPatch("{id:int}/accept-job")]
    [Authorize(Roles = Roles.Technician)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AcceptJob(int id, CancellationToken ct)
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.AcceptJobAsync(id, userId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/arrive
    /// <summary>
    /// Technician báo đến hiện trường (UC-RES-02 Step 4). Không cần body. BR-18: EN_ROUTE → ON_SITE.
    /// </summary>
    [HttpPatch("{id:int}/arrive")]
    [Authorize(Roles = Roles.Technician)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Arrive(int id, CancellationToken ct)
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.ArriveAsync(id, userId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/customer-consent
    /// <summary>
    /// Ghi nhận chấp thuận/từ chối sửa tại chỗ (UC-RES-02 Step 5, BR-RES-01).
    /// consentGiven=false → PROPOSED_TOWING (AF-02).
    /// </summary>
    [HttpPatch("{id:int}/customer-consent")]
    [Authorize(Roles = Roles.Technician)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RecordCustomerConsent(
        int id,
        [FromBody] CustomerConsentDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.RecordConsentAsync(id, userId, request, ct);
            return Ok(result);
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

    // PATCH /api/rescue-requests/{id}/start-diagnosis
    /// <summary>
    /// Technician bắt đầu chẩn đoán (UC-RES-02 Step 6).
    /// canRepairOnSite=false → AF-01, release technician.
    /// </summary>
    [HttpPatch("{id:int}/start-diagnosis")]
    [Authorize(Roles = Roles.Technician)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> StartDiagnosis(
        int id,
        [FromBody] StartDiagnosisDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.StartDiagnosisAsync(id, userId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // POST /api/rescue-requests/{id}/repair-items
    /// <summary>
    /// Ghi nhận vật tư/dịch vụ sử dụng (UC-RES-02 Step 7, BR-20, SMC08).
    /// Mỗi lần gọi thêm items. Lần đầu: DIAGNOSING → REPAIRING.
    /// </summary>
    [HttpPost("{id:int}/repair-items")]
    [Authorize(Roles = Roles.Technician + "," + Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(RepairItemsResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AddRepairItems(
        int id,
        [FromBody] AddRepairItemsDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _rescueService.AddRepairItemsAsync(id, request, ct);
            return StatusCode(StatusCodes.Status201Created, result);
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

    // PATCH /api/rescue-requests/{id}/complete-repair
    /// <summary>
    /// Technician hoàn thành sửa chữa (UC-RES-02 Step 8). REPAIRING → REPAIR_COMPLETE. Release technician.
    /// </summary>
    [HttpPatch("{id:int}/complete-repair")]
    [Authorize(Roles = Roles.Technician)]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CompleteRepair(
        int id,
        [FromBody] CompleteRepairDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.CompleteRepairAsync(id, userId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // =========================================================================
    // UC-RES-03: Dịch vụ kéo xe
    // =========================================================================

    // PATCH /api/rescue-requests/{id}/dispatch-towing
    /// <summary>
    /// SA điều phối kéo xe (UC-RES-03 C1). PROPOSAL_ACCEPTED + TOWING → TOWING_DISPATCHED. SMC05, SMC11.
    /// </summary>
    [HttpPatch("{id:int}/dispatch-towing")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(TowingDispatchResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> DispatchTowing(
        int id,
        [FromBody] DispatchTowingDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.DispatchTowingAsync(id, userId, request, ct);
            return Ok(new { data = result, message = "Dịch vụ kéo xe đã được điều phối." });
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

    // PATCH /api/rescue-requests/{id}/accept-towing
    /// <summary>
    /// Customer chấp nhận kéo xe (UC-RES-03 C2). Không cần body.
    /// TOWING_DISPATCHED → TOWING_ACCEPTED. Từ chối → gọi /cancel.
    /// </summary>
    [HttpPatch("{id:int}/accept-towing")]
    [Authorize]
    [ProducesResponseType(typeof(RescueRequestDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AcceptTowing(int id, CancellationToken ct)
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.AcceptTowingAsync(id, userId, ct);
            return Ok(new { data = result, message = "Khách hàng đã chấp nhận dịch vụ kéo xe." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/complete-towing
    /// <summary>
    /// SA hoàn tất kéo xe — tạo Repair Order tự động (UC-RES-03 C3). BR-19. SMC07.
    /// </summary>
    [HttpPatch("{id:int}/complete-towing")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(CompleteTowingResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CompleteTowing(
        int id,
        [FromBody] CompleteTowingDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.CompleteTowingAsync(id, userId, request, ct);
            return Ok(
                new
                {
                    data = result,
                    message = $"Xe đã được kéo về. Repair Order #{result.ResultingMaintenance?.MaintenanceId} đã được tạo."
                }
            );
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

    // =========================================================================
    // UC-RES-04: Hóa đơn & Thanh toán
    // =========================================================================

    // POST /api/rescue-requests/{id}/invoice
    /// <summary>
    /// SA tạo hóa đơn (UC-RES-04 D1). BR-24: tính member discount. SMP02, SMP06.
    /// </summary>
    [HttpPost("{id:int}/invoice")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(CreateInvoiceResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateInvoice(
        int id,
        [FromBody] CreateInvoiceDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.CreateInvoiceAsync(id, userId, request, ct);
            return StatusCode(
                StatusCodes.Status201Created,
                new { data = result, message = "Hóa đơn đã được tạo thành công." }
            );
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
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // GET /api/rescue-requests/{id}/invoice
    /// <summary>Lấy thông tin hóa đơn và danh sách vật tư/dịch vụ (UC-RES-04 D2).</summary>
    [HttpGet("{id:int}/invoice")]
    [Authorize(Roles = Roles.ServiceAdvisor + "," + Roles.Customer)]
    [ProducesResponseType(typeof(InvoiceWithItemsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
    /// SA gửi hóa đơn cho Customer (UC-RES-04 D3). Không cần body. INVOICED → INVOICE_SENT.
    /// </summary>
    [HttpPatch("{id:int}/invoice/send")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(SendInvoiceResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> SendInvoice(int id, CancellationToken ct)
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.SendInvoiceAsync(id, userId, ct);
            return Ok(new { data = result, message = "Hóa đơn đã được gửi đến khách hàng." });
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

    // PATCH /api/rescue-requests/{id}/invoice/accept
    /// <summary>
    /// Customer chấp nhận hóa đơn (UC-RES-04 D4). Không cần body. INVOICE_SENT → PAYMENT_PENDING.
    /// Khiếu nại → gọi /invoice/dispute.
    /// </summary>
    [HttpPatch("{id:int}/invoice/accept")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(AcceptInvoiceResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> AcceptInvoice(int id, CancellationToken ct)
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.AcceptInvoiceAsync(id, userId, ct);
            return Ok(
                new
                {
                    data = result,
                    message = "Hóa đơn đã được chấp nhận. Vui lòng tiến hành thanh toán."
                }
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // POST /api/rescue-requests/{id}/invoice/payment
    /// <summary>
    /// Customer thanh toán (UC-RES-04 D5). PAYMENT_PENDING → COMPLETED.
    /// BR-23: amount phải khớp finalAmount. SMP03, SMP05.
    /// </summary>
    [HttpPost("{id:int}/invoice/payment")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(PaymentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ProcessPayment(
        int id,
        [FromBody] ProcessPaymentDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.ProcessPaymentAsync(id, userId, request, ct);
            return Ok(
                new
                {
                    data = result,
                    message = "Thanh toán thành công. Cảm ơn bạn đã sử dụng dịch vụ."
                }
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            // Số tiền không khớp hoặc sai ownership
            return ex.Message.Contains("không phải khách hàng")
                ? StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return ex.Message.Contains("không được hỗ trợ")
                ? UnprocessableEntity(new { message = ex.Message })
                : BadRequest(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/invoice/payment/confirm
    /// <summary>
    /// SA xác nhận đã nhận tiền sau khi customer thanh toán. PAYMENT_SUBMITTED -> COMPLETED.
    /// Chỉ sau bước này đơn cứu hộ mới được hoàn tất.
    /// </summary>
    [HttpPatch("{id:int}/invoice/payment/confirm")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(PaymentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ConfirmPayment(int id, CancellationToken ct)
    {
        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.ConfirmPaymentAsync(id, userId, ct);
            return Ok(
                new
                {
                    data = result,
                    message = "SA đã xác nhận nhận tiền. Đơn cứu hộ đã hoàn tất."
                }
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }
    // =========================================================================
    // UC-RES-05: Tranh chấp hóa đơn
    // =========================================================================

    // POST /api/rescue-requests/{id}/invoice/dispute
    /// <summary>
    /// Customer tạo khiếu nại hóa đơn (UC-RES-05 E1). INVOICE_SENT → INVOICE_DISPUTED. BR-26. SMC12.
    /// </summary>
    [HttpPost("{id:int}/invoice/dispute")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(DisputeCreatedResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateDispute(
        int id,
        [FromBody] CreateDisputeDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.CreateDisputeAsync(id, userId, request, ct);
            return StatusCode(
                StatusCodes.Status201Created,
                new
                {
                    data = result,
                    message = "Khiếu nại đã được ghi nhận. SA sẽ xem xét và phản hồi."
                }
            );
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // PATCH /api/rescue-requests/{id}/invoice/resolve-dispute
    /// <summary>
    /// SA xử lý tranh chấp và gửi lại hóa đơn (UC-RES-05 E2). INVOICE_DISPUTED → INVOICE_SENT. BR-26.
    /// </summary>
    [HttpPatch("{id:int}/invoice/resolve-dispute")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(ResolveDisputeResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ResolveDispute(
        int id,
        [FromBody] ResolveDisputeDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.ResolveDisputeAsync(id, userId, request, ct);
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
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // =========================================================================
    // UC-RES-06: Hủy / Spam
    // =========================================================================

    // PATCH /api/rescue-requests/{id}/cancel
    /// <summary>
    /// SA hủy yêu cầu cứu hộ (UC-RES-06 F1). Bất kỳ trạng thái (trừ COMPLETED) → CANCELLED.
    /// Side effects: release technician, cancel CarMaintenance nếu có. BR-26. SMC06.
    /// </summary>
    [HttpPatch("{id:int}/cancel")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(CancelRescueResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancel(
        int id,
        [FromBody] CancelRescueDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.CancelAsync(id, userId, request, ct);
            return Ok(new { data = result, message = "Yêu cầu cứu hộ đã bị hủy." });
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

    // PATCH /api/rescue-requests/{id}/mark-spam
    /// <summary>
    /// SA đánh dấu Spam (UC-RES-06 F2). PENDING/REVIEWING → CANCELLED. BR-26. SMC14, SMC06.
    /// </summary>
    [HttpPatch("{id:int}/mark-spam")]
    [Authorize(Roles = Roles.ServiceAdvisor)]
    [ProducesResponseType(typeof(MarkSpamResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> MarkSpam(
        int id,
        [FromBody] MarkSpamDto request,
        CancellationToken ct
    )
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (userId, err) = ExtractUserId();
        if (err != null)
            return err;

        try
        {
            var result = await _rescueService.MarkSpamAsync(id, userId, request, ct);
            return Ok(new { data = result, message = "Yêu cầu đã bị đánh dấu Spam và hủy." });
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

    // =========================================================================
    // Private helpers — nhất quán với AppointmentsController, CustomerCarsController
    // =========================================================================

    /// <summary>
    /// Trích xuất UserID từ JWT claim NameIdentifier.
    /// Trả về (userId, null) nếu thành công; (0, UnauthorizedResult) nếu thất bại.
    /// </summary>
    private (int userId, IActionResult? error) ExtractUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(claim) || !int.TryParse(claim, out var uid))
            return (
                0,
                Unauthorized(
                    new { message = "Token không hợp lệ hoặc thiếu thông tin người dùng." }
                )
            );
        return (uid, null);
    }

    /// <summary>Kiểm tra role của user hiện tại từ JWT claim Role.</summary>
    private bool IsRole(string role) => User.FindFirstValue(ClaimTypes.Role) == role;
}

// Bổ sung Enum status Rescue cho FE
// PENDING: khách vừa tạo yêu cầu cứu hộ, hệ thống mới tiếp nhận.
// REVIEWING: SA đang xem xét yêu cầu. Có khai báo trong constants, nhưng hiện chưa thấy service set trực tiếp.
// PROPOSED_ROADSIDE: SA đã đề xuất phương án sửa tại chỗ.
// PROPOSED_TOWING: SA đã đề xuất kéo xe về xưởng. Trạng thái này cũng dùng khi khách từ chối sửa tại chỗ hoặc kỹ thuật viên xác nhận không sửa tại chỗ được.
// PROPOSAL_ACCEPTED: khách hàng đã đồng ý đề xuất của SA; từ đây mới được đóng cọc và điều phối.
// DISPATCHED: SA đã phân công kỹ thuật viên cho ca cứu hộ tại chỗ.
// EN_ROUTE: kỹ thuật viên đã nhận job và đang di chuyển tới hiện trường.
// ON_SITE: kỹ thuật viên đã tới nơi.
// DIAGNOSING: bắt đầu chẩn đoán tại hiện trường, đồng thời đã tạo Repair Order.
// REPAIRING: đang thực hiện sửa chữa tại chỗ.
// REPAIR_COMPLETE: sửa tại chỗ xong.
// TOWING_DISPATCHED: đã điều phối dịch vụ kéo xe.
// TOWING_ACCEPTED: khách đã chấp nhận phương án kéo xe.
// TOWED: xe đã được kéo về xưởng.
// INVOICED: đã tạo hóa đơn.
// INVOICE_SENT: hóa đơn đã được gửi cho khách.
// PAYMENT_PENDING: khách đã chấp nhận hóa đơn, đang chờ thanh toán.
// COMPLETED: đã thanh toán xong, ca cứu hộ hoàn tất.
// CANCELLED: yêu cầu bị hủy.
// SPAM: trạng thái logic cho yêu cầu rác. Có khai báo trong constants, nhưng code hiện tại khi mark spam lại set thẳng sang CANCELLED, nên thực tế gần như không lưu SPAM riêng
