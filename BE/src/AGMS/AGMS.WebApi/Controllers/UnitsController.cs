using AGMS.Application;
using AGMS.Application.Contracts; 
using AGMS.Application.DTOs.Unit;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles = "Admin")] // TẠM THỜI TẮT
    public class UnitsController : ControllerBase
    {
        private readonly IUnitService _unitService;

        public UnitsController(IUnitService unitService)
        {
            _unitService = unitService;
        }

        // UC59 - View Units of Measure
        [HttpGet]
        public async Task<IActionResult> GetUnits([FromQuery] UnitFilterDto filter)
        {
            try
            {
                var result = await _unitService.GetUnitsAsync(filter);

                if (result.TotalCount == 0)
                {
                    bool isFiltering = !string.IsNullOrWhiteSpace(filter.SearchTerm) || !string.IsNullOrWhiteSpace(filter.Type);

                    result.SystemMessage = isFiltering
                        ? "MSG_UNIT02: No matching units found"
                        : "MSG_UNIT01: No units of measure found";
                }

                return Ok(result);
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

        // Add Unit of Measure
        [HttpPost]
        public async Task<IActionResult> CreateUnit([FromBody] CreateUnitRequest request)
        {
            // Kiểm tra các field bắt buộc từ DTO
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "MSG_UNIT05: Required fields missing", Errors = ModelState });
            }

            // KIỂM TRA TYPE: Chỉ cho phép "Part" hoặc "Service" (Không phân biệt hoa thường)
            if (string.IsNullOrWhiteSpace(request.Type) ||
               (!request.Type.Equals("Part", StringComparison.OrdinalIgnoreCase) &&
                !request.Type.Equals("Service", StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { Message = "MSG_UNIT06: Unit type must be strictly 'Part' or 'Service'." });
            }

            try
            {
                var result = await _unitService.AddUnitAsync(request);

                if (!result.IsSuccess)
                {
                    return Conflict(new { Message = result.Message });
                }

                return StatusCode(201, new { Message = result.Message, Data = result.Data });
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

        // Edit Unit of Measure
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUnit(int id, [FromBody] UpdateUnitRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "MSG_UNIT05: Required fields missing", Errors = ModelState });
            }

            // KIỂM TRA TYPE: Chỉ cho phép "Part" hoặc "Service" (Không phân biệt hoa thường)
            if (string.IsNullOrWhiteSpace(request.Type) ||
               (!request.Type.Equals("Part", StringComparison.OrdinalIgnoreCase) &&
                !request.Type.Equals("Service", StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { Message = "MSG_UNIT06: Unit type must be strictly 'Part' or 'Service'." });
            }

            try
            {
                var result = await _unitService.UpdateUnitAsync(id, request);

                if (!result.IsSuccess)
                {
                    if (result.Message.Contains("MSG_UNIT04"))
                    {
                        return Conflict(new { Message = result.Message });
                    }
                    return NotFound(new { Message = result.Message });
                }

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

        // Delete Unit of Measure
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            try
            {
                var result = await _unitService.DeleteUnitAsync(id);

                if (!result.IsSuccess)
                {
                    if (result.Message.Contains("MSG_UNIT08"))
                    {
                        return BadRequest(new { Message = result.Message });
                    }
                    return NotFound(new { Message = result.Message });
                }

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