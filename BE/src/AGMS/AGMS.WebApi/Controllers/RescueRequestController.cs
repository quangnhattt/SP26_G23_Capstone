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
