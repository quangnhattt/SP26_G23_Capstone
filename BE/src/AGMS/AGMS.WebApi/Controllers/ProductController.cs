using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Product;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/products")]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("parts")]
    [ProducesResponseType(typeof(IEnumerable<PartProductListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPartProducts(CancellationToken ct)
    {
        var response = await _productService.GetPartProductsAsync(ct);
        return Ok(response);
    }
}
