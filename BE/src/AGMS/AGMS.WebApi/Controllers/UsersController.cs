using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Users;
using AGMS.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // GET /api/users?page=1&pageSize=20
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct)
    {
        var users = await _userService.GetUsersExceptAdminAsync(ct);

        if (page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0)
        {
            var skip = (page.Value - 1) * pageSize.Value;
            users = users.Skip(skip).Take(pageSize.Value).ToList();
        }

        return Ok(users);
    }

    // POST /api/users
    [HttpPost]
    [ProducesResponseType(typeof(UserDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        try
        {
            var user = await _userService.CreateUserAsync(request, ct);
            return StatusCode(StatusCodes.Status201Created, user);
        }
        catch (ConflictException ex)
        {
            return Conflict(new { message = ex.Message });
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

    // PUT /api/users/{userId}
    [HttpPut("{userId:int}")]
    [ProducesResponseType(typeof(UserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int userId, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        try
        {
            var user = await _userService.UpdateUserAsync(userId, request, ct);
            return Ok(user);
        }
        catch (ConflictException ex)
        {
            return Conflict(new { message = ex.Message });
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
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/users/search
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<UserListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] int? roleId,
        [FromQuery] bool? isActive,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct)
    {
        var users = await _userService.SearchUsersAsync(q, roleId, isActive, ct);

        if (page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0)
        {
            var skip = (page.Value - 1) * pageSize.Value;
            users = users.Skip(skip).Take(pageSize.Value).ToList();
        }

        return Ok(users);
    }

    // PATCH /api/users/{userId}/deactivate
    [HttpPatch("{userId:int}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(int userId, CancellationToken ct)
    {
        try
        {
            await _userService.DeactivateUserAsync(userId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PATCH /api/users/{userId}/activate
    [HttpPatch("{userId:int}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(int userId, CancellationToken ct)
    {
        try
        {
            await _userService.ActivateUserAsync(userId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}