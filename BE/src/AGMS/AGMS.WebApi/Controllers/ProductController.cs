using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Product;
using Microsoft.AspNetCore.Mvc;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

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
    [ProducesResponseType(typeof(PagedResultDto<PartProductListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPartProducts([FromQuery] string? code, [FromQuery] string? name, [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct)
    {
        var query = new PartProductQueryDto
        {
            Code = code,
            Name = name,
            Page = page ?? 1,
            PageSize = pageSize ?? 20
        };

        var response = await _productService.GetPartProductsAsync(query, ct);
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

    [HttpPatch("parts/{id:int}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivePartProduct(int id, CancellationToken ct)
    {
        var success = await _productService.DeactivePartProductAsync(id, ct);
        if (!success)
        {
            return NotFound();
        }
        return NoContent();
    }
    [HttpPatch("parts/{id:int}/active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivePartProductAsync(int id, CancellationToken ct)
    {
        var success = await _productService.ActivePartProductAsync(id, ct);
        if (!success)
        {
            return NotFound();
        }
        return NoContent();
    }

    //Product service 

    [HttpGet("services")]
    [ProducesResponseType(typeof(PagedResultDto<ServiceProductListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServiceProducts([FromQuery] string? code, [FromQuery] string? name, [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct)
    {
        var query = new ServiceProductQueryDto
        {
            Code = code,
            Name = name,
            Page = page ?? 1,
            PageSize = pageSize ?? 20
        };
        var response = await _productService.GetServiceProductsAsync(query, ct);
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


}
