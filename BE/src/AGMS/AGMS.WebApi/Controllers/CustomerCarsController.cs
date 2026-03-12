using System.Security.Claims;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Car;
using AGMS.Application.DTOs.RepairRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/customer/cars")]
[Authorize]
public class CustomerCarsController : ControllerBase
{
    private readonly ICarService _carService;

    public CustomerCarsController(ICarService carService)
    {
        _carService = carService;
    }

    // GET /api/customer/cars
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CustomerCarListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCustomerCars(CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        var cars = await _carService.GetCustomerCarsAsync(userId, ct);
        return Ok(cars);
    }

    // POST /api/customer/cars
    [HttpPost]
    [ProducesResponseType(typeof(CarDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddCar([FromBody] CreateCarDto dto, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        try
        {
            var result = await _carService.AddCarAsync(userId, dto, ct);
            return StatusCode(StatusCodes.Status201Created, result);
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

    // PUT /api/customer/cars/{id}
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(CarDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateCar(int id, [FromBody] UpdateCarDto dto, CancellationToken ct)
    {
        var (userId, error) = ExtractUserId();
        if (error != null) return error;

        try
        {
            var result = await _carService.UpdateCarAsync(userId, id, dto, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private (int userId, IActionResult? error) ExtractUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(claim) || !int.TryParse(claim, out var uid))
            return (0, Unauthorized(new { message = "Invalid or missing user id claim." }));
        return (uid, null);
    }
}
