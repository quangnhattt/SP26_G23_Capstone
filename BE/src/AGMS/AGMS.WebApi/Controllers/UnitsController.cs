using AGMS.Application;
using AGMS.Application.Contracts; // Import Interface IUnitService
using AGMS.Application.DTOs.Unit; // Import UnitFilterDto
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles = "Admin")] // TẠM THỜI TẮT: Khi nào làm Frontend có tính năng Login (BR-01, BR-03) thì bỏ 2 dấu // đi nhé.
    public class UnitsController : ControllerBase
    {
        private readonly IUnitService _unitService;

        public UnitsController(IUnitService unitService)
        {
            _unitService = unitService;
        }

        // Chức năng UC59 - View Units of Measure
        [HttpGet]
        public async Task<IActionResult> GetUnits([FromQuery] UnitFilterDto filter)
        {
            try
            {
                // Gọi xuống tầng Service để xử lý logic tìm kiếm, phân trang
                var result = await _unitService.GetUnitsAsync(filter);

                // Xử lý Luồng thay thế (AF-01 và AF-02)
                if (result.TotalCount == 0)
                {
                    bool isFiltering = !string.IsNullOrWhiteSpace(filter.SearchTerm) || !string.IsNullOrWhiteSpace(filter.Type);

                    result.SystemMessage = isFiltering
                        ? "MSG_UNIT02: No matching units found"
                        : "MSG_UNIT01: No units of measure found";
                }

                // Trả về Normal Flow
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Xử lý Exception EX01: Lỗi kết nối DB hoặc lỗi code
                return StatusCode(500, new
                {
                    Message = "MSG_SYS01: System error occurred while processing your request.",
                    Error = ex.Message
                });
            }
        }

        //Add Unit of Measure
        [HttpPost]
        public async Task<IActionResult> CreateUnit([FromBody] CreateUnitRequest request)
        {
            // Xử lý AF-02: Missing required fields
            // (Nếu .NET bắt lỗi Required trong DTO, nó sẽ văng lỗi vào ModelState)
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "MSG_UNIT05: Required fields missing", Errors = ModelState });
            }

            try
            {
                var result = await _unitService.AddUnitAsync(request);

                // Xử lý AF-01: Unit already exists
                if (!result.IsSuccess)
                {
                    return Conflict(new { Message = result.Message }); // Trả về HTTP 409 Conflict
                }

                // Normal Flow: Thành công (Step 6)
                return StatusCode(201, new { Message = result.Message, Data = result.Data }); // HTTP 201 Created
            }
            catch (Exception ex)
            {
                // Xử lý Exception EX01: Database connection failure
                return StatusCode(500, new
                {
                    Message = "MSG_SYS01: System error occurred while processing your request.",
                    Error = ex.Message
                });
            }
        }

        // Edit Unit of Measure
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUnit(int id, [FromBody] UpdateUnitRequest request)
        {
            // Xử lý AF-02: Missing required fields
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "MSG_UNIT05: Required fields missing", Errors = ModelState });
            }

            try
            {
                var result = await _unitService.UpdateUnitAsync(id, request);

                if (!result.IsSuccess)
                {
                    // Nếu lỗi là do trùng tên -> 409 Conflict
                    if (result.Message.Contains("MSG_UNIT04"))
                    {
                        return Conflict(new { Message = result.Message });
                    }

                    // Nếu lỗi là không tìm thấy ID -> 404 Not Found
                    return NotFound(new { Message = result.Message });
                }

                // Normal Flow: Thành công -> 200 OK
                return Ok(new { Message = result.Message });
            }
            catch (Exception ex)
            {
                // Xử lý Exception EX01
                return StatusCode(500, new
                {
                    Message = "MSG_SYS01: System error occurred while processing your request.",
                    Error = ex.Message
                });
            }
        }

        //Delete Unit of Measure
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            try
            {
                var result = await _unitService.DeleteUnitAsync(id);

                if (!result.IsSuccess)
                {
                    // Nếu lỗi là do đang được sử dụng (AF-01) -> Trả về 400 Bad Request
                    if (result.Message.Contains("MSG_UNIT08"))
                    {
                        return BadRequest(new { Message = result.Message });
                    }

                    // Nếu không tìm thấy -> 404
                    return NotFound(new { Message = result.Message });
                }

                // Thành công -> 200 OK
                return Ok(new { Message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = "MSG_SYS01: System error occurred while processing your request.",
                    Error = ex.Message
                });
            }
        }
    }
}