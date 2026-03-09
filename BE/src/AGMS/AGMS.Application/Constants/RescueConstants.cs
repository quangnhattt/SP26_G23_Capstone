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

    /// <summary>Trạng thái hợp lệ để SA gửi đề xuất (BR-18) — UC-RES-01</summary>
    public static readonly IReadOnlySet<string> AllowedForPropose =
        new HashSet<string> { Pending, Reviewing };

    // --- UC-RES-02: Status sets cho từng bước dispatch & roadside repair ---

    /// <summary>SA assign kỹ thuật viên — chỉ khi đề xuất sửa tại chỗ đã gửi (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForAssignTechnician =
        new HashSet<string> { ProposedRoadside };

    /// <summary>Technician nhận job — chỉ khi đã được điều phối (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptJob =
        new HashSet<string> { Dispatched };

    /// <summary>Technician báo đến nơi — chỉ khi đang trên đường (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForArrive =
        new HashSet<string> { EnRoute };

    /// <summary>Customer chấp thuận/từ chối sửa — khi technician đã đến hiện trường (BR-RES-01)</summary>
    public static readonly IReadOnlySet<string> AllowedForConsent =
        new HashSet<string> { OnSite };

    /// <summary>Technician bắt đầu chẩn đoán — khi đã được duyệt tại hiện trường (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForDiagnosis =
        new HashSet<string> { OnSite };

    /// <summary>Ghi vật tư/dịch vụ (BR-20) — sau chẩn đoán hoặc trong khi đang sửa</summary>
    public static readonly IReadOnlySet<string> AllowedForRepairItems =
        new HashSet<string> { Diagnosing, Repairing };

    /// <summary>Hoàn thành sửa chữa — chỉ khi đang trong trạng thái sửa (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForCompleteRepair =
        new HashSet<string> { Repairing };

    // --- UC-RES-03: Status sets cho từng bước điều phối kéo xe ---

    /// <summary>SA điều phối kéo xe — chỉ khi đề xuất kéo xe đã được tạo (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForDispatchTowing =
        new HashSet<string> { ProposedTowing };

    /// <summary>Customer chấp nhận kéo xe — khi dịch vụ kéo đã được điều phối (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptTowing =
        new HashSet<string> { TowingDispatched };

    /// <summary>SA hoàn tất kéo xe và tạo Repair Order (BR-19) — khi customer đã chấp nhận (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForCompleteTowing =
        new HashSet<string> { TowingAccepted };

    // --- UC-RES-04: Status sets cho từng bước hóa đơn & thanh toán ---

    /// <summary>SA tạo hóa đơn — sau khi sửa ven đường hoàn tất hoặc xe đã kéo về (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForCreateInvoice =
        new HashSet<string> { RepairComplete, Towed };

    /// <summary>SA gửi hóa đơn — sau khi hóa đơn đã được tạo (BR-18, BR-25)</summary>
    public static readonly IReadOnlySet<string> AllowedForSendInvoice =
        new HashSet<string> { Invoiced };

    /// <summary>Customer chấp nhận hóa đơn — sau khi SA đã gửi (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptInvoice =
        new HashSet<string> { InvoiceSent };

    /// <summary>Customer thanh toán — chỉ khi hóa đơn đã được chấp nhận (BR-18, BR-23)</summary>
    public static readonly IReadOnlySet<string> AllowedForProcessPayment =
        new HashSet<string> { PaymentPending };

    // --- UC-RES-05: Status sets cho tranh chấp hóa đơn ---

    /// <summary>Customer khiếu nại — chỉ khi hóa đơn đã gửi (BR-18, BR-26)</summary>
    public static readonly IReadOnlySet<string> AllowedForDispute =
        new HashSet<string> { InvoiceSent };

    /// <summary>SA xử lý tranh chấp — chỉ khi đang trong trạng thái tranh chấp (BR-18, BR-26)</summary>
    public static readonly IReadOnlySet<string> AllowedForResolveDispute =
        new HashSet<string> { InvoiceDisputed };

    // --- UC-RES-06: Hủy / Spam ---

    /// <summary>
    /// Trạng thái không thể hủy (BR-18).
    /// Cancel bị chặn khi rescue đã hoàn tất thanh toán (COMPLETED).
    /// </summary>
    public static readonly IReadOnlySet<string> NotCancellable =
        new HashSet<string> { Completed, Cancelled };

    /// <summary>
    /// Trạng thái hợp lệ để đánh dấu Spam (BR-18, SMC14).
    /// Chỉ cho phép khi yêu cầu còn ở giai đoạn tiếp nhận ban đầu.
    /// </summary>
    public static readonly IReadOnlySet<string> AllowedForMarkSpam =
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
/// Hằng số loại Repair Order tạo từ cứu hộ — dùng trong CarMaintenance.MaintenanceType
/// </summary>
public static class RescueMaintenanceType
{
    /// <summary>Sửa chữa tại chỗ ven đường (UC-RES-02)</summary>
    public const string Roadside = "RESCUE_ROADSIDE";
    /// <summary>Kéo xe về xưởng (UC-RES-03)</summary>
    public const string Towing   = "RESCUE_TOWING";
}

/// <summary>
/// Trạng thái Repair Order dùng để validate BR-11 (active RO check)
/// </summary>
public static class CarMaintenanceStatus
{
    public const string Waiting   = "WAITING";
    public const string Completed = "COMPLETED";
    public const string Cancelled = "CANCELLED";
}

/// <summary>
/// Trạng thái hóa đơn cứu hộ — map từ RescueRequest.Status (BR-18)
/// </summary>
public static class InvoiceStatus
{
    public const string Created  = "CREATED";
    public const string Sent     = "SENT";
    public const string Accepted = "ACCEPTED";
    public const string Paid     = "PAID";
    public const string Disputed = "DISPUTED";

    /// <summary>Map trạng thái rescue sang trạng thái hóa đơn tương ứng</summary>
    public static string FromRescueStatus(string rescueStatus) => rescueStatus switch
    {
        RescueStatus.Invoiced        => Created,
        RescueStatus.InvoiceSent     => Sent,
        RescueStatus.PaymentPending  => Accepted,
        RescueStatus.Completed       => Paid,
        RescueStatus.InvoiceDisputed => Disputed,
        _                            => Created
    };
}

/// <summary>
/// Phương thức thanh toán hợp lệ (UC-RES-04, BR-23)
/// </summary>
public static class PaymentMethod
{
    public const string Cash     = "CASH";
    public const string Card     = "CARD";
    public const string Transfer = "TRANSFER";
    public const string Ewallet  = "EWALLET";

    /// <summary>Tập hợp các phương thức thanh toán được hỗ trợ</summary>
    public static readonly IReadOnlySet<string> ValidMethods =
        new HashSet<string> { Cash, Card, Transfer, Ewallet };
}

/// <summary>
/// Trạng thái giao dịch thanh toán (UC-RES-04 BR-23)
/// </summary>
public static class PaymentStatus
{
    public const string Success = "SUCCESS";
    public const string Failed  = "FAILED";
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
