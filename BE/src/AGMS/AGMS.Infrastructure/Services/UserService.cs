using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Users;
using AGMS.Application.Exceptions;
using AGMS.Domain.Entities;

namespace AGMS.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<IEnumerable<UserListItemDto>> GetUsersExceptAdminAsync(CancellationToken ct)
    {
        var users = await _userRepository.GetUsersExceptAdminAsync(ct);
        return users.Select(MapToListItem);
    }

    public async Task<UserDetailDto> CreateUserAsync(CreateUserRequest request, CancellationToken ct)
    {
        var fullName = request.FullName.Trim();
        var email = request.Email.Trim();
        var phone = request.PhoneNumber?.Trim();

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.");

        if (request.Password != request.ConfirmPassword)
            throw new ArgumentException("Password and confirmation do not match.");

        if (request.RoleID is < 2 or > 4)
            throw new ArgumentException("RoleID must be 2 (ServiceAdvisor), 3 (Technician), or 4 (Customer).");

        if (await _userRepository.GetByEmailAsync(email, ct) != null)
            throw new ConflictException("Email is already in use.");

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var existingByPhone = await _userRepository.GetByPhoneAsync(phone, ct);
            if (existingByPhone != null)
                throw new ConflictException("Phone number is already in use.");
        }

        var (hash, salt) = _passwordHasher.Hash(request.Password);
        var userCode = "USR" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var now = DateTime.UtcNow;

        var user = new User
        {
            UserID = 0,
            UserCode = userCode,
            FullName = fullName,
            Username = email,
            PasswordHash = hash,
            PasswordSalt = salt,
            Email = email,
            Phone = phone,
            RoleID = request.RoleID,
            IsActive = true,
            CreatedDate = now
        };

        await _userRepository.AddAsync(user, ct);

        var created = await _userRepository.GetByIdAsync(user.UserID, ct)
                      ?? throw new InvalidOperationException("Failed to load created user.");

        return MapToDetail(created);
    }

    public async Task<UserDetailDto> UpdateUserAsync(int userId, UpdateUserRequest request, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct)
                   ?? throw new KeyNotFoundException($"User with ID {userId} not found.");

        if (user.RoleID == 1)
            throw new InvalidOperationException("Cannot modify Admin user.");

        if (request.RoleID is < 2 or > 4)
            throw new ArgumentException("RoleID must be 2 (ServiceAdvisor), 3 (Technician), or 4 (Customer).");

        var fullName = request.FullName.Trim();
        var phone = request.PhoneNumber?.Trim();

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var existingByPhone = await _userRepository.GetByPhoneAsync(phone, ct);
            if (existingByPhone != null && existingByPhone.UserID != userId)
                throw new ConflictException("Phone number is already in use.");
        }

        user.FullName = fullName;
        user.Phone = phone;
        user.RoleID = request.RoleID;

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        await _userRepository.UpdateAsync(user, ct);

        var updated = await _userRepository.GetByIdAsync(userId, ct)
                      ?? throw new InvalidOperationException("Failed to load updated user.");

        return MapToDetail(updated);
    }

    public async Task<IEnumerable<UserListItemDto>> SearchUsersAsync(string? q, int? roleId, bool? isActive, CancellationToken ct)
    {
        var users = await _userRepository.SearchUsersExceptAdminAsync(q, roleId, isActive, ct);
        return users.Select(MapToListItem);
    }

    public async Task DeactivateUserAsync(int userId, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct)
                   ?? throw new KeyNotFoundException($"User with ID {userId} not found.");

        if (user.RoleID == 1)
            throw new InvalidOperationException("Cannot deactivate Admin user.");

        if (!user.IsActive) return;

        await _userRepository.SetActiveAsync(userId, false, ct);
    }

    public async Task ActivateUserAsync(int userId, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct)
                   ?? throw new KeyNotFoundException($"User with ID {userId} not found.");

        if (user.RoleID == 1)
            throw new InvalidOperationException("Cannot activate Admin user.");

        if (user.IsActive) return;

        await _userRepository.SetActiveAsync(userId, true, ct);
    }

    private static UserListItemDto MapToListItem(User u) => new()
    {
        UserID = u.UserID,
        FullName = u.FullName,
        Email = u.Email,
        Phone = u.Phone,
        RoleID = u.RoleID,
        RoleName = u.Role.RoleName,
        IsActive = u.IsActive,
        CreatedDate = u.CreatedDate
    };

    private static UserDetailDto MapToDetail(User u) => new()
    {
        UserID = u.UserID,
        FullName = u.FullName,
        Email = u.Email,
        Phone = u.Phone,
        RoleID = u.RoleID,
        RoleName = u.Role.RoleName,
        IsActive = u.IsActive,
        CreatedDate = u.CreatedDate
    };
}