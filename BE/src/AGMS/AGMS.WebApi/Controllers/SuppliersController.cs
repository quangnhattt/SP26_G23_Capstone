using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Supplier;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = Roles.Admin)]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierService _supplierService;

        public SuppliersController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        // 1. GET: /api/suppliers
        [HttpGet]
        public async Task<IActionResult> GetSuppliers([FromQuery] SupplierFilterDto filter)
        {
            try
            {
                var result = await _supplierService.GetSuppliersAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "MSG_SYS01: System error", Error = ex.Message });
            }
        }

        // 2. POST: /api/suppliers
        [HttpPost]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "MSG_SUP00: Invalid input data", Errors = ModelState });
            }

            try
            {
                var result = await _supplierService.CreateSupplierAsync(request);

                if (!result.IsSuccess)
                    return Conflict(new { Message = result.Message }); // Lỗi trùng lặp (409)

                return StatusCode(201, new { Message = result.Message, Data = result.Data }); // Tạo thành công (201)
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "MSG_SYS01: System error", Error = ex.Message });
            }
        }

        // 3. PUT: /api/suppliers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, [FromBody] UpdateSupplierRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "MSG_SUP00: Invalid input data", Errors = ModelState });
            }

            try
            {
                var result = await _supplierService.UpdateSupplierAsync(id, request);

                if (!result.IsSuccess)
                {
                    if (result.Message.Contains("not found")) return NotFound(new { Message = result.Message });
                    return Conflict(new { Message = result.Message });
                }

                return Ok(new { Message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "MSG_SYS01: System error", Error = ex.Message });
            }
        }

        // 4. PATCH: /api/suppliers/{id}/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ChangeSupplierStatus(int id, [FromBody] UpdateSupplierStatusRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "MSG_SUP00: Invalid input data", Errors = ModelState });
            }

            try
            {
                var result = await _supplierService.ChangeSupplierStatusAsync(id, request.IsActive);

                if (!result.IsSuccess)
                {
                    if (result.Message.Contains("not found")) return NotFound(new { Message = result.Message });
                    return BadRequest(new { Message = result.Message });
                }

                return Ok(new { Message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "MSG_SYS01: System error", Error = ex.Message });
            }
        }
    }
}