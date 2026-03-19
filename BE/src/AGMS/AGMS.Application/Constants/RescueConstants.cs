namespace AGMS.Application.Constants;

/// <summary>
/// Hằng số trạng thái của yêu cầu cứu hộ — tuân thủ workflow BR-18
/// </summary>
public static class RescueStatus
{
    public const string Pending          = "PENDING";
    public const string Reviewing        = "REVIEWING";
    public const string ProposedRoadside = "PROPOSED_ROADSIDE";
    public const string ProposedTowing   = "PROPOSED_TOWING";
    public const string Dispatched       = "DISPATCHED";
    public const string EnRoute          = "EN_ROUTE";
    public const string OnSite           = "ON_SITE";
    public const string Diagnosing       = "DIAGNOSING";
    public const string Repairing        = "REPAIRING";
    public const string RepairComplete   = "REPAIR_COMPLETE";
    public const string TowingDispatched = "TOWING_DISPATCHED";
    public const string TowingAccepted   = "TOWING_ACCEPTED";
    public const string Towed            = "TOWED";
    public const string Invoiced         = "INVOICED";
    public const string InvoiceSent      = "INVOICE_SENT";
    public const string PaymentPending   = "PAYMENT_PENDING";
    public const string InvoiceDisputed  = "INVOICE_DISPUTED";
    public const string Completed        = "COMPLETED";
    public const string Cancelled        = "CANCELLED";
    public const string Spam             = "SPAM";

    /// <summary>
    /// Trạng thái hợp lệ để SA gửi đề xuất (BR-18)
    /// </summary>
    public static readonly IReadOnlySet<string> AllowedForPropose =
        new HashSet<string> { Pending, Reviewing };
}

/// <summary>
/// Hằng số loại cứu hộ
/// </summary>
public static class RescueType
{
    public const string Roadside = "ROADSIDE";
    public const string Towing   = "TOWING";
}

/// <summary>
/// Hằng số RoleID người dùng trong hệ thống
/// </summary>
public static class UserRole
{
    public const int Admin          = 1;
    public const int ServiceAdvisor = 2;
    public const int Technician     = 3;
    public const int Customer       = 4;
}
