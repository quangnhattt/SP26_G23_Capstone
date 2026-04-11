namespace AGMS.Application.Constants;

/// <summary>
/// Hằng số trạng thái của yêu cầu cứu hộ — tuân thủ workflow BR-18
/// </summary>
public static class RescueStatus
{
    public const string Pending = "PENDING"; // Trạng thái đơn sau khi khách gửi yêu cầu
    public const string Reviewing = "REVIEWING"; // Bỏ
    public const string ProposedRoadside = "PROPOSED_ROADSIDE"; // Trạng thái đơn sau khi SA gửi đề xuất cho khách hàng
    public const string ProposedTowing = "PROPOSED_TOWING"; // Trạng thái đơn sau khi SA gửi đề xuất cho khách hàng
    public const string ProposalAccepted = "PROPOSAL_ACCEPTED"; // Trạng thái đơn sau khi khách hàng đồng ý với đề xuất
    public const string Dispatched = "DISPATCHED"; // bỏ
    public const string EnRoute = "EN_ROUTE"; // Trạng thái đơn sau khi SA gán 1 technician vào 1 đơn cứu hộ
    public const string OnSite = "ON_SITE"; // Trạng thái đơn sau khi Tech tới hiện trường
    public const string Diagnosing = "DIAGNOSING"; // Trạng thái đơn sau khi tech chuẩn đoán
    public const string Repairing = "REPAIRING"; //Trạng thái đơn khi tech ghi nhận vật tư vàbắt đầu sửa chữa
    public const string RepairComplete = "REPAIR_COMPLETE"; // Trạng thái đơn khi tech sửa chữa xong
    public const string TowingDispatched = "TOWING_DISPATCHED"; // / Trạng thái đơn khi SA điều xe kéo
    public const string TowingAccepted = "TOWING_ACCEPTED"; // Trạng thái đơn khi Cus đồng ý với phương án kéo xe
    public const string Towed = "TOWED"; // Trạng thái đơn khi tech tới hiện trường và đang thực hiện kéo xe về gara
    public const string Invoiced = "INVOICED"; // Trạng thái đơn khi SA tạo hoá đơn
    public const string InvoiceSent = "INVOICE_SENT"; // Trạng thái đơn khi hoá đơn được gửi tới khách hàng
    public const string PaymentPending = "PAYMENT_PENDING"; // Trạng thái đơn khi đang chờ khách thanh toán
    public const string PaymentSubmitted = "PAYMENT_SUBMITTED"; // Trạng thái đơn khi khách đã thanh toán và chờ SA xác nhận nhận tiền
    public const string InvoiceDisputed = "INVOICE_DISPUTED"; //bỏ
    public const string Completed = "COMPLETED"; // Trạng thái đơn khi khách hàng thanh toán xong, job đóng
    public const string Cancelled = "CANCELLED"; // Trạng thái đơn khi đóng bởi bất cứ ai có quyền
    public const string Spam = "SPAM"; // Trang thái đơn sau khi SA đánh dấu là SPAM

    /// <summary>Trạng thái hợp lệ để SA gửi đề xuất (BR-18) — UC-RES-01</summary>
    public static readonly IReadOnlySet<string> AllowedForPropose = new HashSet<string>
    {
        Pending,
        Reviewing
    };

    /// <summary>Customer chấp nhận đề xuất sau khi SA đã gửi phương án xử lý.</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptProposal = new HashSet<string>
    {
        ProposedRoadside,
        ProposedTowing
    };

    /// <summary>Thanh toán đặt cọc chỉ được mở sau khi khách hàng đã đồng ý đề xuất.</summary>
    public static readonly IReadOnlySet<string> AllowedForDeposit = new HashSet<string>
    {
        ProposalAccepted
    };

    // --- UC-RES-02: Status sets cho từng bước dispatch & roadside repair ---

    /// <summary>SA assign kỹ thuật viên — chỉ khi khách hàng đã đồng ý đề xuất sửa tại chỗ (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForAssignTechnician = new HashSet<string>
    {
        ProposalAccepted
    };

    /// <summary>Technician nhận job — chỉ khi đã được điều phối (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptJob = new HashSet<string>
    {
        Dispatched
    };

    /// <summary>Technician báo đến nơi — chỉ khi đang trên đường (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForArrive = new HashSet<string> { EnRoute };

    /// <summary>Customer chấp thuận/từ chối sửa — khi technician đã đến hiện trường (BR-RES-01)</summary>
    public static readonly IReadOnlySet<string> AllowedForConsent = new HashSet<string> { OnSite };

    /// <summary>Technician bắt đầu chẩn đoán — khi đã được duyệt tại hiện trường (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForDiagnosis = new HashSet<string>
    {
        OnSite
    };

    /// <summary>Ghi vật tư/dịch vụ (BR-20) — sau chẩn đoán hoặc trong khi đang sửa</summary>
    public static readonly IReadOnlySet<string> AllowedForRepairItems = new HashSet<string>
    {
        Diagnosing,
        Repairing
    };

    /// <summary>Hoàn thành sửa chữa — chỉ khi đang trong trạng thái sửa (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForCompleteRepair = new HashSet<string>
    {
        Repairing
    };

    // --- UC-RES-03: Status sets cho từng bước điều phối kéo xe ---

    /// <summary>SA điều phối kéo xe — chỉ khi khách hàng đã đồng ý đề xuất kéo xe (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForDispatchTowing = new HashSet<string>
    {
        ProposalAccepted
    };

    /// <summary>Customer chấp nhận kéo xe — khi dịch vụ kéo đã được điều phối (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptTowing = new HashSet<string>
    {
        TowingDispatched
    };

    /// <summary>SA hoàn tất kéo xe và tạo Repair Order (BR-19) — khi customer đã chấp nhận (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForCompleteTowing = new HashSet<string>
    {
        TowingAccepted
    };

    // --- UC-RES-04: Status sets cho từng bước hóa đơn & thanh toán ---

    /// <summary>SA tạo hóa đơn — sau khi sửa ven đường hoàn tất hoặc xe đã kéo về (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForCreateInvoice = new HashSet<string>
    {
        RepairComplete,
        Towed
    };

    /// <summary>SA gửi hóa đơn — sau khi hóa đơn đã được tạo (BR-18, BR-25)</summary>
    public static readonly IReadOnlySet<string> AllowedForSendInvoice = new HashSet<string>
    {
        Invoiced
    };

    /// <summary>Customer chấp nhận hóa đơn — sau khi SA đã gửi (BR-18)</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptInvoice = new HashSet<string>
    {
        InvoiceSent
    };

    /// <summary>Customer thanh toán — chỉ khi hóa đơn đã được chấp nhận (BR-18, BR-23)</summary>
    public static readonly IReadOnlySet<string> AllowedForProcessPayment = new HashSet<string>
    {
        PaymentPending
    };

    /// <summary>SA xác nhận đã nhận tiền sau khi khách đã thanh toán.</summary>
    public static readonly IReadOnlySet<string> AllowedForConfirmPayment = new HashSet<string>
    {
        PaymentSubmitted
    };

    // --- UC-RES-05: Status sets cho tranh chấp hóa đơn ---

    /// <summary>Customer khiếu nại — chỉ khi hóa đơn đã gửi (BR-18, BR-26)</summary>
    public static readonly IReadOnlySet<string> AllowedForDispute = new HashSet<string>
    {
        InvoiceSent
    };

    /// <summary>SA xử lý tranh chấp — chỉ khi đang trong trạng thái tranh chấp (BR-18, BR-26)</summary>
    public static readonly IReadOnlySet<string> AllowedForResolveDispute = new HashSet<string>
    {
        InvoiceDisputed
    };

    // --- UC-RES-06: Hủy / Spam ---

    /// <summary>
    /// Trạng thái không thể hủy (BR-18).
    /// Cancel bị chặn khi rescue đã hoàn tất thanh toán (COMPLETED).
    /// </summary>
    public static readonly IReadOnlySet<string> NotCancellable = new HashSet<string>
    {
        Completed,
        Cancelled
    };

    /// <summary>
    /// Trạng thái hợp lệ để đánh dấu Spam (BR-18, SMC14).
    /// Chỉ cho phép khi yêu cầu còn ở giai đoạn tiếp nhận ban đầu.
    /// </summary>
    public static readonly IReadOnlySet<string> AllowedForMarkSpam = new HashSet<string>
    {
        Pending,
        Reviewing
    };
}

/// <summary>
/// Hằng số loại cứu hộ
/// </summary>
public static class RescueType
{
    public const string Roadside = "ROADSIDE";
    public const string Towing = "TOWING";
}

/// <summary>
/// Hằng số loại Repair Order tạo từ cứu hộ — dùng trong CarMaintenance.MaintenanceType
/// </summary>
public static class RescueMaintenanceType
{
    /// <summary>
    /// DB hiện chỉ chấp nhận MaintenanceType = RESCUE cho mọi hồ sơ phát sinh từ rescue.
    /// Phân biệt roadside / towing được giữ ở RescueRequest.RescueType.
    /// </summary>
    public const string Unified = "RESCUE";

    /// <summary>Sửa chữa tại chỗ ven đường (UC-RES-02)</summary>
    public const string Roadside = Unified;

    /// <summary>Kéo xe về xưởng (UC-RES-03)</summary>
    public const string Towing = Unified;
}

/// <summary>
/// Trạng thái Repair Order dùng để validate BR-11 (active RO check)
/// </summary>
public static class CarMaintenanceStatus
{
    public const string Waiting = "WAITING";
    public const string Completed = "COMPLETED";
    public const string Cancelled = "CANCELLED";
}

/// <summary>
/// Trạng thái hóa đơn cứu hộ — map từ RescueRequest.Status (BR-18)
/// </summary>
public static class InvoiceStatus
{
    public const string Created = "CREATED";
    public const string Sent = "SENT";
    public const string Accepted = "ACCEPTED";
    public const string Paid = "PAID";
    public const string Disputed = "DISPUTED";

    /// <summary>Map trạng thái rescue sang trạng thái hóa đơn tương ứng</summary>
    public static string FromRescueStatus(string rescueStatus) =>
        rescueStatus switch
        {
            RescueStatus.Invoiced => Created,
            RescueStatus.InvoiceSent => Sent,
            RescueStatus.PaymentPending => Accepted,
            RescueStatus.PaymentSubmitted => Paid,
            RescueStatus.Completed => Paid,
            RescueStatus.InvoiceDisputed => Disputed,
            _ => Created
        };
}

/// <summary>
/// Phương thức thanh toán hợp lệ (UC-RES-04, BR-23)
/// </summary>
public static class PaymentMethod
{
    public const string Cash = "CASH";
    public const string Card = "CARD";
    public const string Transfer = "TRANSFER";
    public const string Ewallet = "EWALLET";

    /// <summary>Tập hợp các phương thức thanh toán được hỗ trợ</summary>
    public static readonly IReadOnlySet<string> ValidMethods = new HashSet<string>
    {
        Cash,
        Card,
        Transfer,
        Ewallet
    };
}

/// <summary>
/// Trạng thái giao dịch thanh toán (UC-RES-04 BR-23)
/// </summary>
public static class PaymentStatus
{
    public const string Success = "SUCCESS";
    public const string Failed = "FAILED";
}

public static class RescueDepositPolicy
{
    public const decimal DefaultInitialDepositAmount = 500000m;
}

/// <summary>
/// Hằng số RoleID người dùng trong hệ thống
/// </summary>
public static class UserRole
{
    public const int Admin = 1;
    public const int ServiceAdvisor = 2;
    public const int Technician = 3;
    public const int Customer = 4;
}
