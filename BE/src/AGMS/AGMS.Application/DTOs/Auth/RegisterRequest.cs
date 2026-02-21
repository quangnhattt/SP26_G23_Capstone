namespace AGMS.Application.DTOs.Auth;

public class RegisterRequest
{
    public string FullName { get; set; } = null!;

    /// <summary>
    /// Username chosen by the user (must be unique and not equal to Email).
    /// </summary>
    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    /// <summary>
    /// Optional phone number; must be unique if provided.
    /// </summary>
    public string? PhoneNumber { get; set; }

    public string Password { get; set; } = null!;
    public string ConfirmPassword { get; set; } = null!;
}
