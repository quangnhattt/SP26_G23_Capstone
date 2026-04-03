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


    [HttpPost("parts")]
    [ProducesResponseType(typeof(PartProductListItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddPartProduct([FromBody] CreatePartProductDto request, CancellationToken ct)
    {
        try
        {
            var created = await _productService.AddPartProductAsync(request, ct);
            return CreatedAtAction(nameof(GetPartProducts), new { }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpPut("parts/{id:int}")]
    [ProducesResponseType(typeof(PartProductListItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> updatePartProduct(int id, [FromBody] UpdatePartProductDto request, CancellationToken ct)
    {
        try
        {
            var updated = await _productService.UpdatePartProductAsync(id, request, ct);
            if (updated == null)
            {
                return NotFound();
            }
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("parts/{id:int}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePartProductStatus(int id, [FromBody] UpdateProductStatusDto request, CancellationToken ct)
    {
        var success = await _productService.ChangePartProductStatusAsync(id, request.IsActive, ct);
        if (!success)
        {
            return NotFound();
        }
        return Ok(new { success = true, isActive = request.IsActive });
    }

    //Product service 

    [HttpGet("services")]
    [ProducesResponseType(typeof(IEnumerable<ServiceProductListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServiceProducts(CancellationToken ct)
    {
        var response = await _productService.GetServiceProductsAsync(ct);
        return Ok(response);
    }
    [HttpPost("services")]
    [ProducesResponseType(typeof(ServiceProductListItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddServiceProduct([FromBody] CreateServiceProductDto request, CancellationToken ct)
    {
        try
        {
            var created = await _productService.AddServiceProductAsync(request, ct);
            return CreatedAtAction(nameof(GetServiceProducts), new { }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }


    [HttpPut("services/{id:int}")]
    [ProducesResponseType(typeof(ServiceProductListItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateServiceProduct(int id, [FromBody] UpdateServiceProductDto request, CancellationToken ct)
    {
        try
        {
            var updated = await _productService.UpdateServiceProductAsync(id, request, ct);
            if (updated == null)
                return NotFound();
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("services/{id:int}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeServiceProductStatus(int id, [FromBody] UpdateProductStatusDto request, CancellationToken ct)
    {
        var success = await _productService.ChangeServiceProductStatusAsync(id, request.IsActive, ct);
        if (!success)
        {
            return NotFound();
        }
        return Ok(new { success = true, isActive = request.IsActive });
    }

}
