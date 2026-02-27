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
        var username = request.Username?.Trim() ?? string.Empty;
        var email = request.Email.Trim();
        var phone = request.PhoneNumber?.Trim();

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.");

        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Username is required.");

        if (username.Equals(email, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Username must not equal email.");

        if (request.Password != request.ConfirmPassword)
            throw new ArgumentException("Password and confirmation do not match.");

        if (request.RoleID is < 2 or > 4)
            throw new ArgumentException("RoleID must be 2 (ServiceAdvisor), 3 (Technician), or 4 (Customer).");

        if (await _userRepository.GetByUsernameAsync(username, ct) != null)
            throw new ConflictException("Username is already in use.");

        if (await _userRepository.GetByEmailAsync(email, ct) != null)
            throw new ConflictException("Email is already in use.");

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var existingByPhone = await _userRepository.GetByPhoneAsync(phone, ct);
            if (existingByPhone != null)
                throw new ConflictException("Phone number is already in use.");
        }

        // Validate Gender if provided
        string? genderValue = null;
        if (!string.IsNullOrWhiteSpace(request.Gender))
        {
            var g = request.Gender.Trim();
            if (!g.Equals("Male", StringComparison.OrdinalIgnoreCase) &&
                !g.Equals("Female", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Gender must be either 'Male' or 'Female'.");
            }

            genderValue = g.Equals("Male", StringComparison.OrdinalIgnoreCase) ? "Male" : "Female";
        }

        var (hash, salt) = _passwordHasher.Hash(request.Password);
        var userCode = "USR" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var now = DateTime.UtcNow;

        var user = new User
        {
            UserID = 0,
            UserCode = userCode,
            FullName = fullName,
            Username = username,
            PasswordHash = hash,
            PasswordSalt = salt,
            Email = email,
            Phone = phone,
            Gender = genderValue,
            DateOfBirth = request.DateOfBirth,
            Image = string.IsNullOrWhiteSpace(request.Image) ? null : request.Image.Trim(),
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
        var newEmail = user.Email;
        var newUsername = user.Username;
        var newPhone = request.PhoneNumber?.Trim();

        // UserCode: không cho phép chỉnh sửa
        if (!string.IsNullOrWhiteSpace(request.UserCode) &&
            !string.Equals(request.UserCode.Trim(), user.UserCode, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("UserCode cannot be changed.");
        }

        // Email: nếu được cung cấp và thay đổi thì check unique
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailTrim = request.Email.Trim();
            if (!emailTrim.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
            {
                var existingByEmail = await _userRepository.GetByEmailAsync(emailTrim, ct);
                if (existingByEmail != null && existingByEmail.UserID != userId)
                    throw new ConflictException("Email is already in use.");

                newEmail = emailTrim;
            }
        }

        // Phone: nếu được cung cấp và thay đổi thì check unique
        if (!string.IsNullOrWhiteSpace(newPhone))
        {
            var existingByPhone = await _userRepository.GetByPhoneAsync(newPhone, ct);
            if (existingByPhone != null && existingByPhone.UserID != userId)
                throw new ConflictException("Phone number is already in use.");
        }

        // Username: nếu được cung cấp và thay đổi thì check unique
        if (!string.IsNullOrWhiteSpace(request.Username))
        {
            var usernameTrim = request.Username.Trim();
            if (string.IsNullOrWhiteSpace(usernameTrim))
                throw new ArgumentException("Username cannot be empty.");

            var existingByUsername = await _userRepository.GetByUsernameAsync(usernameTrim, ct);
            if (existingByUsername != null && existingByUsername.UserID != userId)
                throw new ConflictException("Username is already in use.");

            newUsername = usernameTrim;
        }

        // Username must not equal Email (mới)
        if (newUsername.Equals(newEmail, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Username must not equal email.");

        // Gán lại vào domain entity
        user.FullName = fullName;
        user.Email = newEmail;
        user.Username = newUsername;
        user.Phone = newPhone;
        user.RoleID = request.RoleID;

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        if (!string.IsNullOrWhiteSpace(request.Gender))
        {
            var g = request.Gender.Trim();
            if (!g.Equals("Male", StringComparison.OrdinalIgnoreCase) &&
                !g.Equals("Female", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Gender must be either 'Male' or 'Female'.");
            }

            // Lưu đúng kiểu chữ để tương thích với CHAR(10) 'Male'/'Female'
            user.Gender = g.Equals("Male", StringComparison.OrdinalIgnoreCase) ? "Male" : "Female";
        }
        else
        {
            user.Gender = null;
        }
        user.Image = string.IsNullOrWhiteSpace(request.Image) ? null : request.Image.Trim();
        user.DateOfBirth = request.DateOfBirth;

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

    public async Task<UserDetailDto> GetCurrentUserAsync(int userId, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct)
                   ?? throw new KeyNotFoundException($"User with ID {userId} not found.");

        return MapToDetail(user);
    }

    public async Task<UserDetailDto> UpdateCurrentUserProfileAsync(int userId, UpdateMyProfileRequest request, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct)
                   ?? throw new KeyNotFoundException($"User with ID {userId} not found.");

        var fullName = request.FullName.Trim();
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("FullName is required.", nameof(request.FullName));

        var newPhone = request.PhoneNumber?.Trim();

        // Phone: nếu được cung cấp và thay đổi thì check unique
        if (!string.IsNullOrWhiteSpace(newPhone))
        {
            var existingByPhone = await _userRepository.GetByPhoneAsync(newPhone, ct);
            if (existingByPhone != null && existingByPhone.UserID != userId)
                throw new ConflictException("Phone number is already in use.");
        }

        // Gender (optional, Male/Female)
        if (!string.IsNullOrWhiteSpace(request.Gender))
        {
            var g = request.Gender.Trim();
            if (!g.Equals("Male", StringComparison.OrdinalIgnoreCase) &&
                !g.Equals("Female", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Gender must be either 'Male' or 'Female'.");
            }

            user.Gender = g.Equals("Male", StringComparison.OrdinalIgnoreCase) ? "Male" : "Female";
        }
        else
        {
            user.Gender = null;
        }

        user.FullName = fullName;
        user.Phone = newPhone;
        user.Image = string.IsNullOrWhiteSpace(request.Image) ? null : request.Image.Trim();
        user.DateOfBirth = request.DateOfBirth;

        await _userRepository.UpdateAsync(user, ct);

        var updated = await _userRepository.GetByIdAsync(userId, ct)
                      ?? throw new InvalidOperationException("Failed to load updated user.");

        return MapToDetail(updated);
    }

    private static UserListItemDto MapToListItem(User u) => new()
    {
        UserID = u.UserID,
        UserCode = u.UserCode,
        FullName = u.FullName,
        Username = u.Username,
        Email = u.Email,
        Phone = u.Phone,
        Gender = u.Gender?.Trim(),
        DateOfBirth = u.DateOfBirth,
        Image = u.Image,
        RoleID = u.RoleID,
        RoleName = u.Role.RoleName,
        IsActive = u.IsActive,
        CreatedDate = u.CreatedDate
    };

    private static UserDetailDto MapToDetail(User u) => new()
    {
        UserID = u.UserID,
        UserCode = u.UserCode,
        FullName = u.FullName,
        Username = u.Username,
        Email = u.Email,
        Phone = u.Phone,
        Gender = u.Gender?.Trim(),
        DateOfBirth = u.DateOfBirth,
        Image = u.Image,
        RoleID = u.RoleID,
        RoleName = u.Role.RoleName,
        IsActive = u.IsActive,
        CreatedDate = u.CreatedDate,
        LastLoginDate = u.LastLoginDate,
        TotalSpending = u.TotalSpending,
        CurrentRankID = u.CurrentRankID,
        IsOnRescueMission = u.IsOnRescueMission,
        Skills = u.Skills
    };
}