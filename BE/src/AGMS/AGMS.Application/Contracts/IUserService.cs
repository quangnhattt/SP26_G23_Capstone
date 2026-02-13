using AGMS.Application.DTOs.Users;

namespace AGMS.Application.Contracts;

public interface IUserService
{
    Task<IEnumerable<UserListItemDto>> GetUsersExceptAdminAsync(CancellationToken ct);

    Task<UserDetailDto> CreateUserAsync(CreateUserRequest request, CancellationToken ct);
    Task<UserDetailDto> UpdateUserAsync(int userId, UpdateUserRequest request, CancellationToken ct);
    Task<IEnumerable<UserListItemDto>> SearchUsersAsync(string? q, int? roleId, bool? isActive, CancellationToken ct);
    Task DeactivateUserAsync(int userId, CancellationToken ct);
    Task ActivateUserAsync(int userId, CancellationToken ct);
}