using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Users;
using AGMS.Domain.Entities;

namespace AGMS.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserListItemDto>> GetUsersExceptAdminAsync(CancellationToken ct)
    {
        var users = await _userRepository.GetUsersExceptAdminAsync(ct);

        // Map Domain.User (+ its Role navigation) to DTO
        return users.Select(u => new UserListItemDto
        {
            UserID = u.UserID,
            FullName = u.FullName,
            Email = u.Email,
            Phone = u.Phone,
            RoleID = u.RoleID,
            RoleName = u.Role.RoleName,   // from joined Role
            IsActive = u.IsActive,
            CreatedDate = u.CreatedDate
        });
    }
}