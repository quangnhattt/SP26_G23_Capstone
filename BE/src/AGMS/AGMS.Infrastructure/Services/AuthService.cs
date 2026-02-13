using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Auth;
using AGMS.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace AGMS.Infrastructure.Services;

public class AuthService : IAuthService
{
    private const string ForgotPasswordType = "FORGOT_PASS";
    private const int OtpValidMinutes = 10;

    private readonly IUserRepository _userRepo;
    private readonly IVerificationCodeRepository _verificationCodeRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuthTokenService _tokenService;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository userRepo,
        IVerificationCodeRepository verificationCodeRepo,
        IPasswordHasher passwordHasher,
        IAuthTokenService tokenService,
        IConfiguration configuration)
    {
        _userRepo = userRepo;
        _verificationCodeRepo = verificationCodeRepo;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public async Task RegisterAsync(RegisterRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Password) || req.Password != req.ConfirmPassword)
            throw new InvalidOperationException("Password and confirmation do not match.");

        var fullName = req.FullName.Trim();
        var username = req.Username?.Trim() ?? string.Empty;
        var email = req.Email.Trim();
        var phone = string.IsNullOrWhiteSpace(req.PhoneNumber) ? null : req.PhoneNumber.Trim();

        if (string.IsNullOrWhiteSpace(username))
            throw new InvalidOperationException("Username is required.");

        if (username.Equals(email, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Username must not equal email.");

        if (await _userRepo.GetByUsernameAsync(username, ct) != null)
            throw new InvalidOperationException("Username is already registered.");

        if (await _userRepo.GetByEmailAsync(email, ct) != null)
            throw new InvalidOperationException("Email is already registered.");

        if (!string.IsNullOrWhiteSpace(phone) && await _userRepo.GetByPhoneAsync(phone, ct) != null)
            throw new InvalidOperationException("Phone number is already registered.");

        var roleId = _configuration.GetValue<int>("Auth:DefaultCustomerRoleId");
        if (roleId <= 0)
            throw new InvalidOperationException("Invalid default customer role configuration.");

        var (hash, salt) = _passwordHasher.Hash(req.Password);
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
            RoleID = roleId,
            IsActive = true,
            CreatedDate = now
        };

        await _userRepo.AddAsync(user, ct);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var user = await _userRepo.GetByEmailAsync(req.Email.Trim(), ct)
            ?? throw new InvalidOperationException("Invalid email or password.");

        if (!user.IsActive)
            throw new InvalidOperationException("Account is disabled.");

        if (!_passwordHasher.Verify(req.Password, user.PasswordHash, user.PasswordSalt))
            throw new InvalidOperationException("Invalid email or password.");

        var (token, expiresAtUtc) = _tokenService.GenerateToken(user.UserID, user.Email, user.FullName);

        return new LoginResponse
        {
            Token = token,
            ExpiresAtUtc = expiresAtUtc,
            UserId = user.UserID,
            Email = user.Email,
            FullName = user.FullName
        };
    }

    public async Task<ForgotPasswordOtpResponse> RequestForgotPasswordOtpAsync(ForgotPasswordRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim();
        var otp = Random.Shared.Next(100_000, 1_000_000).ToString();
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(OtpValidMinutes);

        await _verificationCodeRepo.CreateAsync(email, otp, ForgotPasswordType, expiresAtUtc, ct);

        return new ForgotPasswordOtpResponse
        {
            Otp = otp,
            ExpiresAtUtc = expiresAtUtc
        };
    }

    public async Task ResetPasswordWithOtpAsync(ResetPasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword != req.ConfirmNewPassword)
            throw new InvalidOperationException("New password and confirmation do not match.");

        var email = req.Email.Trim();
        var nowUtc = DateTime.UtcNow;

        var vc = await _verificationCodeRepo.GetValidAsync(email, req.Otp.Trim(), ForgotPasswordType, nowUtc, ct)
            ?? throw new InvalidOperationException("Invalid or expired OTP.");

        var user = await _userRepo.GetByEmailAsync(email, ct)
            ?? throw new InvalidOperationException("User not found.");

        var (hash, salt) = _passwordHasher.Hash(req.NewPassword);
        await _userRepo.UpdatePasswordAsync(user.UserID, hash, salt, ct);
        await _verificationCodeRepo.MarkUsedAsync(vc.Id, ct);
    }
}
