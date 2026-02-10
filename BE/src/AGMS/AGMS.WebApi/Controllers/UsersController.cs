using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Users;
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

    // GET /api/users?page=1&pageSize=20 (paging optional)
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct)
    {
        var users = await _userService.GetUsersExceptAdminAsync(ct);

        // Optional basic paging (in-memory)
        if (page.HasValue && pageSize.HasValue && page > 0 && pageSize > 0)
        {
            var skip = (page.Value - 1) * pageSize.Value;
            users = users.Skip(skip).Take(pageSize.Value).ToList();
        }

        return Ok(users);
    }
}