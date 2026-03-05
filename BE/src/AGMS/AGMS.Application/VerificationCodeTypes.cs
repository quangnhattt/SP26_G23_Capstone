namespace AGMS.Application;

/// <summary>
/// Centralized verification code types used in dbo.VerificationCodes.Type.
/// Must stay in sync with database CHECK constraint CK_VerificationCodes_Type.
/// </summary>
public static class VerificationCodeTypes
{
    public const string ForgotPassword = "FORGOT_PASS";
    public const string Register = "REGISTER";
    public const string EmailVerify = "EMAIL_VERIFY";
}

