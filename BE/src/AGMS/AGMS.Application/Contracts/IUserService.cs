using AGMS.Application.DTOs.Users;

namespace AGMS.Application.Contracts;

public interface IUserService
{
    Task<IEnumerable<UserListItemDto>> GetUsersExceptAdminAsync(CancellationToken ct);
}