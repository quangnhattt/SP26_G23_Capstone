using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Users;
using AGMS.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = Roles.Admin + "," + Roles.ServiceAdvisor)]
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
        [FromQuery] string? q,
        [FromQuery] string? phone,
        [FromQuery] int? roleId,
        [FromQuery] bool? isActive,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct)
    {
        var hasFilters =
            !string.IsNullOrWhiteSpace(q) ||
            !string.IsNullOrWhiteSpace(phone) ||
            roleId.HasValue ||
            isActive.HasValue;

        var users = hasFilters
            ? await _userService.SearchUsersAsync(q, phone, roleId, isActive, ct)
            : await _userService.GetUsersExceptAdminAsync(ct);

        if (page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0)
        {
            var skip = (page.Value - 1) * pageSize.Value;
            users = users.Skip(skip).Take(pageSize.Value).ToList();
        }

        return Ok(users);
    }

    // POST /api/users
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
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
    [Authorize(Roles = Roles.Admin)]
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
        [FromQuery] string? phone,
        [FromQuery] int? roleId,
        [FromQuery] bool? isActive,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct)
    {
        var users = await _userService.SearchUsersAsync(q, phone, roleId, isActive, ct);

        if (page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0)
        {
            var skip = (page.Value - 1) * pageSize.Value;
            users = users.Skip(skip).Take(pageSize.Value).ToList();
        }

        return Ok(users);
    }

    // PATCH /api/users/{userId}/status
    [HttpPatch("{userId:int}/status")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeStatus(int userId, [FromBody] UpdateUserStatusRequest request, CancellationToken ct)
    {
        try
        {
            await _userService.ChangeUserStatusAsync(userId, request.IsActive, ct);
            return Ok(new { success = true, isActive = request.IsActive });
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