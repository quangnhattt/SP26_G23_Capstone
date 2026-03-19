using AGMS.Application;
using AGMS.Application.Contracts;
using AGMS.Application.Exceptions;
using AGMS.Application.DTOs.Auth;
using AGMS.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace AGMS.Infrastructure.Services;

public class AuthService : IAuthService
{
    private const int OtpValidMinutes = 5;

    private readonly IUserRepository _userRepo;
    private readonly IVerificationCodeRepository _verificationCodeRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuthTokenService _tokenService;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository userRepo,
        IVerificationCodeRepository verificationCodeRepo,
        IPasswordHasher passwordHasher,
        IAuthTokenService tokenService,
        IConfiguration configuration,
        IEmailSender emailSender)
    {
        _userRepo = userRepo;
        _verificationCodeRepo = verificationCodeRepo;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _configuration = configuration;
        _emailSender = emailSender;
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

        var existingByEmail = await _userRepo.GetByEmailAsync(email, ct);
        var now = DateTime.UtcNow;

        if (existingByEmail != null)
        {
            // Nếu là user chưa verify email và đã quá thời gian cho phép, xóa rồi cho phép đăng ký lại
            if (!existingByEmail.IsEmailVerified &&
                (now - existingByEmail.CreatedDate) > TimeSpan.FromMinutes(OtpValidMinutes))
            {
                await _userRepo.DeleteAsync(existingByEmail.UserID, ct);
            }
            else
            {
                throw new InvalidOperationException("Email is already registered.");
            }
        }

        if (!string.IsNullOrWhiteSpace(phone) && await _userRepo.GetByPhoneAsync(phone, ct) != null)
            throw new InvalidOperationException("Phone number is already registered.");

        var roleId = _configuration.GetValue<int>("Auth:DefaultCustomerRoleId");
        if (roleId <= 0)
            throw new InvalidOperationException("Invalid default customer role configuration.");

        var (hash, salt) = _passwordHasher.Hash(req.Password);
        var userCode = "USR" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

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
            CreatedDate = now,
            IsEmailVerified = false
        };

        await _userRepo.AddAsync(user, ct);

        // Gửi OTP xác thực email ngay sau khi đăng ký
        await SendEmailVerificationOtpInternal(email, ct);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var user = await _userRepo.GetByEmailAsync(req.Email.Trim(), ct)
            ?? throw new InvalidOperationException("Invalid email or password.");

        if (!user.IsActive)
            throw new InvalidOperationException("Account is disabled.");

        if (!_passwordHasher.Verify(req.Password, user.PasswordHash, user.PasswordSalt))
            throw new InvalidOperationException("Invalid email or password.");

        var now = DateTime.UtcNow;

        if (!user.IsEmailVerified)
        {
            var age = now - user.CreatedDate;
            if (age > TimeSpan.FromMinutes(OtpValidMinutes))
            {
                // Hết hạn verify: xóa user và yêu cầu đăng ký lại
                await _userRepo.DeleteAsync(user.UserID, ct);
                throw new EmailNotVerifiedException("Account expired. Please register again.", isExpired: true);
            }

            // Chưa verify nhưng vẫn trong thời gian cho phép
            throw new EmailNotVerifiedException("Email is not verified.", isExpired: false);
        }

        var (token, expiresAtUtc) = _tokenService.GenerateToken(user.UserID, user.Email, user.FullName, user.RoleID);

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

        await _verificationCodeRepo.CreateAsync(email, otp, VerificationCodeTypes.ForgotPassword, expiresAtUtc, ct);

        var subject = "AGMS - Password reset code";
        var body =
            $"Your password reset code is: {otp}\n" +
            $"This code will expire in {OtpValidMinutes} minutes.\n\n" +
            "If you did not request this, please ignore this email.";

        // For security, always return a generic response and do not disclose
        // whether the email exists in the system.
        await TrySendEmailAsync(email, subject, body, ct);

        return new ForgotPasswordOtpResponse
        {
            Message = "If the email exists in our system, an OTP has been sent.",
            ExpiresAtUtc = expiresAtUtc
        };
    }


    public async Task ResetPasswordWithOtpAsync(ResetPasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword != req.ConfirmNewPassword)
            throw new InvalidOperationException("New password and confirmation do not match.");

        var email = req.Email.Trim();
        var nowUtc = DateTime.UtcNow;

        var vc = await _verificationCodeRepo.GetValidAsync(email, req.Otp.Trim(), VerificationCodeTypes.ForgotPassword, nowUtc, ct)
            ?? throw new InvalidOperationException("Invalid or expired OTP.");

        var user = await _userRepo.GetByEmailAsync(email, ct)
            ?? throw new InvalidOperationException("User not found.");

        var (hash, salt) = _passwordHasher.Hash(req.NewPassword);
        await _userRepo.UpdatePasswordAsync(user.UserID, hash, salt, ct);
        await _verificationCodeRepo.MarkUsedAsync(vc.Id, ct);
    }

    public async Task SendEmailVerificationOtpAsync(EmailVerificationSendOtpRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim();
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("Email is required.");

        await SendEmailVerificationOtpInternal(email, ct);
    }

    public async Task VerifyEmailOtpAsync(EmailVerificationVerifyOtpRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim();
        var otp = req.Otp.Trim();
        var nowUtc = DateTime.UtcNow;

        var vc = await _verificationCodeRepo.GetValidAsync(email, otp, VerificationCodeTypes.EmailVerify, nowUtc, ct)
            ?? throw new InvalidOperationException("Invalid or expired OTP.");

        await _verificationCodeRepo.MarkUsedAsync(vc.Id, ct);

        var user = await _userRepo.GetByEmailAsync(email, ct);
        if (user == null)
        {
            // Không tiết lộ thông tin nếu email không tồn tại
            return;
        }

        if (!user.IsEmailVerified)
        {
            await _userRepo.SetEmailVerifiedAsync(user.UserID, true, ct);
        }
    }

    private async Task SendEmailVerificationOtpInternal(string email, CancellationToken ct)
    {
        var otp = Random.Shared.Next(100_000, 1_000_000).ToString();
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(OtpValidMinutes);

        await _verificationCodeRepo.CreateAsync(email, otp, VerificationCodeTypes.EmailVerify, expiresAtUtc, ct);

        var subject = "AGMS - Email verification code";
        var body =
            $"Your email verification code is: {otp}\n" +
            $"This code will expire in {OtpValidMinutes} minutes.\n\n" +
            "If you did not request this, you can ignore this email.";

        await TrySendEmailAsync(email, subject, body, ct);
    }

    private async Task TrySendEmailAsync(string email, string subject, string body, CancellationToken ct)
    {
        try
        {
            await _emailSender.SendEmailAsync(email, subject, body, ct);
        }
        catch
        {
            // Không để lộ lỗi gửi email ra ngoài
        }
    }
}
