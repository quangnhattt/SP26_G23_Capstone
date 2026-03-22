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
            throw new InvalidOperationException("Mật khẩu và xác nhận mật khẩu không khớp.");

        if (!IsPasswordStrong(req.Password))
            throw new InvalidOperationException("Mật khẩu không đáp ứng yêu cầu bảo mật.");

        var fullName = req.FullName.Trim();
        var username = req.Username?.Trim() ?? string.Empty;
        var email = req.Email.Trim();
        var phone = string.IsNullOrWhiteSpace(req.PhoneNumber) ? null : req.PhoneNumber.Trim();

        if (string.IsNullOrWhiteSpace(username))
            throw new InvalidOperationException("Tên đăng nhập là bắt buộc.");

        if (username.Equals(email, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Tên đăng nhập không được trùng với email.");

        if (await _userRepo.GetByUsernameAsync(username, ct) != null)
            throw new InvalidOperationException("Tên đăng nhập đã tồn tại.");

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
                throw new InvalidOperationException("Email đã được đăng ký.");
            }
        }

        if (!string.IsNullOrWhiteSpace(phone) && await _userRepo.GetByPhoneAsync(phone, ct) != null)
            throw new InvalidOperationException("Số điện thoại đã được đăng ký.");

        var roleId = _configuration.GetValue<int>("Auth:DefaultCustomerRoleId");
        if (roleId <= 0)
            throw new InvalidOperationException("Cấu hình vai trò mặc định cho khách hàng không hợp lệ.");

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
            ?? throw new InvalidOperationException("Email hoặc mật khẩu không đúng.");

        if (!user.IsActive)
            throw new InvalidOperationException("Tài khoản đã bị khóa.");

        if (!_passwordHasher.Verify(req.Password, user.PasswordHash, user.PasswordSalt))
            throw new InvalidOperationException("Email hoặc mật khẩu không đúng.");

        var now = DateTime.UtcNow;

        if (!user.IsEmailVerified)
        {
            var age = now - user.CreatedDate;
            if (age > TimeSpan.FromMinutes(OtpValidMinutes))
            {
                // Hết hạn verify: xóa user và yêu cầu đăng ký lại
                await _userRepo.DeleteAsync(user.UserID, ct);
                throw new EmailNotVerifiedException("Tài khoản đã hết hạn xác thực. Vui lòng đăng ký lại.", isExpired: true);
            }

            // Chưa verify nhưng vẫn trong thời gian cho phép
            throw new EmailNotVerifiedException("Email chưa được xác thực.", isExpired: false);
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

        var subject = "AGMS - Mã đặt lại mật khẩu";
        var body =
            $"Mã đặt lại mật khẩu của bạn là: {otp}\n" +
            $"Mã này sẽ hết hạn sau {OtpValidMinutes} phút.\n\n" +
            "Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.";

        // For security, always return a generic response and do not disclose
        // whether the email exists in the system.
        await TrySendEmailAsync(email, subject, body, ct);

        return new ForgotPasswordOtpResponse
        {
            Message = "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.",
            ExpiresAtUtc = expiresAtUtc
        };
    }


    public async Task ResetPasswordWithOtpAsync(ResetPasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword != req.ConfirmNewPassword)
            throw new InvalidOperationException("Mật khẩu mới và xác nhận mật khẩu không khớp.");

        if (!IsPasswordStrong(req.NewPassword))
            throw new InvalidOperationException("Mật khẩu không đáp ứng yêu cầu bảo mật.");

        var email = req.Email.Trim();
        var nowUtc = DateTime.UtcNow;

        var vc = await _verificationCodeRepo.GetValidAsync(email, req.Otp.Trim(), VerificationCodeTypes.ForgotPassword, nowUtc, ct)
            ?? throw new InvalidOperationException("OTP không hợp lệ hoặc đã hết hạn.");

        var user = await _userRepo.GetByEmailAsync(email, ct)
            ?? throw new InvalidOperationException("Không tìm thấy người dùng.");

        var (hash, salt) = _passwordHasher.Hash(req.NewPassword);
        await _userRepo.UpdatePasswordAsync(user.UserID, hash, salt, ct);
        await _verificationCodeRepo.MarkUsedAsync(vc.Id, ct);
    }

    public async Task SendEmailVerificationOtpAsync(EmailVerificationSendOtpRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim();
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("Email là bắt buộc.");

        await SendEmailVerificationOtpInternal(email, ct);
    }

    public async Task VerifyEmailOtpAsync(EmailVerificationVerifyOtpRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim();
        var otp = req.Otp.Trim();
        var nowUtc = DateTime.UtcNow;

        var vc = await _verificationCodeRepo.GetValidAsync(email, otp, VerificationCodeTypes.EmailVerify, nowUtc, ct)
            ?? throw new InvalidOperationException("OTP không hợp lệ hoặc đã hết hạn.");

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

    public Task LogoutAsync(int userId, CancellationToken ct) => Task.CompletedTask;

    private static bool IsPasswordStrong(string password)
    {
        if (password.Length < 6)
            return false;

        var hasUpper = false;
        var hasLower = false;
        var hasDigit = false;

        foreach (var ch in password)
        {
            if (char.IsUpper(ch)) hasUpper = true;
            else if (char.IsLower(ch)) hasLower = true;
            else if (char.IsDigit(ch)) hasDigit = true;

            if (hasUpper && hasLower && hasDigit)
                return true;
        }

        return false;
    }

    private async Task SendEmailVerificationOtpInternal(string email, CancellationToken ct)
    {
        var otp = Random.Shared.Next(100_000, 1_000_000).ToString();
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(OtpValidMinutes);

        await _verificationCodeRepo.CreateAsync(email, otp, VerificationCodeTypes.EmailVerify, expiresAtUtc, ct);

        var subject = "AGMS - Mã xác thực email";
        var body =
            $"Mã xác thực email của bạn là: {otp}\n" +
            $"Mã này sẽ hết hạn sau {OtpValidMinutes} phút.\n\n" +
            "Nếu bạn không yêu cầu thao tác này, bạn có thể bỏ qua email.";

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
