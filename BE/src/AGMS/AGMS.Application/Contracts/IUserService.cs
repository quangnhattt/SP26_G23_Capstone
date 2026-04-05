using AGMS.Application.DTOs.Users;

namespace AGMS.Application.Contracts;

public interface IUserService
{
    Task<IEnumerable<UserListItemDto>> GetUsersExceptAdminAsync(CancellationToken ct);

    Task<UserDetailDto> CreateUserAsync(CreateUserRequest request, CancellationToken ct);
    Task<UserDetailDto> UpdateUserAsync(int userId, UpdateUserRequest request, CancellationToken ct);
    Task<IEnumerable<UserListItemDto>> SearchUsersAsync(string? q, string? phone, int? roleId, bool? isActive, CancellationToken ct);
    Task ChangeUserStatusAsync(int userId, bool isActive, CancellationToken ct);

    Task<UserDetailDto> GetCurrentUserAsync(int userId, CancellationToken ct);
    Task<UserDetailDto> UpdateCurrentUserProfileAsync(int userId, UpdateMyProfileRequest request, CancellationToken ct);
}