using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Supplier;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers
{
    [Route("api/Suppliers/{supplierId}/Products")]
    [ApiController]
    public class SupplierProductsController : ControllerBase
    {
        private readonly ISupplierProductService _service;

        public SupplierProductsController(ISupplierProductService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts(int supplierId)
        {
            try
            {
                var result = await _service.GetProductsBySupplierIdAsync(supplierId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddProduct(int supplierId, [FromBody] SupplierProductUpsertDto request)
        {
            try
            {
                await _service.AddSupplierProductAsync(supplierId, request);
                return Ok(new { message = "Thêm sản phẩm cho nhà cung cấp thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{productId}")]
        public async Task<IActionResult> UpdateProduct(int supplierId, int productId, [FromBody] SupplierProductUpsertDto request)
        {
            try
            {
                // Kiểm tra xem ID trên URL có khớp với ID trong Body không 
                if (productId != request.ProductID)
                    return BadRequest(new { message = "ProductID trên đường dẫn không khớp với dữ liệu gửi lên." });

                await _service.UpdateSupplierProductAsync(supplierId, productId, request);
                return Ok(new { message = "Cập nhật thông tin sản phẩm thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{productId}")]
        public async Task<IActionResult> DeleteProduct(int supplierId, int productId)
        {
            try
            {
                await _service.RemoveProductFromSupplierAsync(supplierId, productId);
                return Ok(new { message = "Đã xóa sản phẩm khỏi danh sách nhà cung cấp." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("new-product")]
        public async Task<IActionResult> CreateNewProductAndLink(int supplierId, [FromBody] SupplierNewProductRequestDto request)
        {
            try
            {
                await _service.CreateNewProductAndLinkToSupplierAsync(supplierId, request);
                return Ok(new { message = "Khởi tạo sản phẩm mới và liên kết với nhà cung cấp thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}