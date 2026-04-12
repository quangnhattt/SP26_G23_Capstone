namespace AGMS.Application.Constants;

/// <summary>
/// Hằng số trạng thái của yêu cầu cứu hộ, bám theo workflow nghiệp vụ.
/// </summary>
public static class RescueStatus
{
    public const string Pending = "PENDING"; // Đơn vừa được tạo từ phía khách hàng.
    public const string Reviewing = "REVIEWING"; // Hiện chưa dùng trực tiếp trong service.
    public const string ProposedRoadside = "PROPOSED_ROADSIDE"; // SA đề xuất sửa tại chỗ.
    public const string ProposedTowing = "PROPOSED_TOWING"; // SA đề xuất kéo xe về xưởng.
    public const string ProposalAccepted = "PROPOSAL_ACCEPTED"; // Khách hàng đã đồng ý đề xuất.
    public const string Dispatched = "DISPATCHED"; // Dùng cho nhánh roadside khi đã phân công kỹ thuật viên.
    public const string EnRoute = "EN_ROUTE"; // Kỹ thuật viên đang di chuyển tới hiện trường.
    public const string OnSite = "ON_SITE"; // Kỹ thuật viên đã tới hiện trường.
    public const string Diagnosing = "DIAGNOSING"; // Đang chẩn đoán tại chỗ.
    public const string Repairing = "REPAIRING"; // Đang sửa chữa tại chỗ.
    public const string RepairComplete = "REPAIR_COMPLETE"; // Đã hoàn tất sửa chữa tại chỗ.
    public const string TowingDispatched = "TOWING_DISPATCHED"; // Đã điều phối dịch vụ kéo xe.
    public const string TowingArrived = "TOWING_ARRIVED"; // Xe kéo đã tới địa điểm của khách.
    public const string TowingAccepted = "TOWING_ACCEPTED"; // Khách đã đồng ý cho kéo xe.
    public const string Towed = "TOWED"; // Xe đã được kéo về xưởng.
    public const string Invoiced = "INVOICED"; // SA đã tạo hóa đơn.
    public const string InvoiceSent = "INVOICE_SENT"; // Hóa đơn đã được gửi cho khách.
    public const string PaymentPending = "PAYMENT_PENDING"; // Đang chờ khách thanh toán.
    public const string PaymentSubmitted = "PAYMENT_SUBMITTED"; // Khách đã thanh toán, chờ SA xác nhận nhận tiền.
    public const string InvoiceDisputed = "INVOICE_DISPUTED"; // Khách đang khiếu nại hóa đơn.
    public const string Completed = "COMPLETED"; // Ca cứu hộ đã hoàn tất.
    public const string Cancelled = "CANCELLED"; // Yêu cầu đã bị hủy.
    public const string Spam = "SPAM"; // Trạng thái logic cho yêu cầu rác.

    /// <summary>Trạng thái hợp lệ để SA gửi đề xuất xử lý.</summary>
    public static readonly IReadOnlySet<string> AllowedForPropose = new HashSet<string>
    {
        Pending,
        Reviewing
    };

    /// <summary>Trạng thái hợp lệ để khách hàng đồng ý đề xuất.</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptProposal = new HashSet<string>
    {
        ProposedRoadside,
        ProposedTowing
    };

    /// <summary>Đặt cọc chỉ mở sau khi khách hàng đã đồng ý đề xuất.</summary>
    public static readonly IReadOnlySet<string> AllowedForDeposit = new HashSet<string>
    {
        ProposalAccepted
    };

    /// <summary>SA chỉ được phân công kỹ thuật viên khi khách đã đồng ý sửa tại chỗ.</summary>
    public static readonly IReadOnlySet<string> AllowedForAssignTechnician = new HashSet<string>
    {
        ProposalAccepted
    };

    /// <summary>Kỹ thuật viên chỉ nhận job khi đơn đã được dispatch.</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptJob = new HashSet<string>
    {
        Dispatched
    };

    /// <summary>Kỹ thuật viên báo tới nơi khi đang trên đường.</summary>
    public static readonly IReadOnlySet<string> AllowedForArrive = new HashSet<string> { EnRoute };

    /// <summary>Ghi nhận khách chấp thuận hoặc từ chối sửa tại chỗ khi kỹ thuật viên đã tới nơi.</summary>
    public static readonly IReadOnlySet<string> AllowedForConsent = new HashSet<string> { OnSite };

    /// <summary>Bắt đầu chẩn đoán khi đơn đang ở trạng thái tại hiện trường.</summary>
    public static readonly IReadOnlySet<string> AllowedForDiagnosis = new HashSet<string>
    {
        OnSite
    };

    /// <summary>Ghi nhận vật tư hoặc dịch vụ trong quá trình chẩn đoán và sửa chữa.</summary>
    public static readonly IReadOnlySet<string> AllowedForRepairItems = new HashSet<string>
    {
        Diagnosing,
        Repairing
    };

    /// <summary>Hoàn tất sửa chữa khi đơn đang ở trạng thái sửa chữa.</summary>
    public static readonly IReadOnlySet<string> AllowedForCompleteRepair = new HashSet<string>
    {
        Repairing
    };

    /// <summary>SA điều phối kéo xe sau khi khách đã đồng ý phương án kéo xe.</summary>
    public static readonly IReadOnlySet<string> AllowedForDispatchTowing = new HashSet<string>
    {
        ProposalAccepted
    };

    /// <summary>SA cập nhật xe kéo đã tới điểm hẹn với khách.</summary>
    public static readonly IReadOnlySet<string> AllowedForTowingArrive = new HashSet<string>
    {
        TowingDispatched
    };

    /// <summary>Khách hàng chấp nhận kéo xe sau khi xe kéo đã tới nơi.</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptTowing = new HashSet<string>
    {
        TowingArrived
    };

    /// <summary>Khách hàng hủy kéo xe sau khi xe kéo đã tới nơi.</summary>
    public static readonly IReadOnlySet<string> AllowedForRejectTowing = new HashSet<string>
    {
        TowingArrived
    };

    /// <summary>SA hoàn tất kéo xe sau khi khách đã chấp nhận kéo xe.</summary>
    public static readonly IReadOnlySet<string> AllowedForCompleteTowing = new HashSet<string>
    {
        TowingAccepted
    };

    /// <summary>SA tạo hóa đơn sau khi sửa tại chỗ xong hoặc xe đã được kéo về xưởng.</summary>
    public static readonly IReadOnlySet<string> AllowedForCreateInvoice = new HashSet<string>
    {
        RepairComplete,
        Towed
    };

    /// <summary>SA gửi hóa đơn sau khi đã tạo hóa đơn.</summary>
    public static readonly IReadOnlySet<string> AllowedForSendInvoice = new HashSet<string>
    {
        Invoiced
    };

    /// <summary>Khách hàng chấp nhận hóa đơn sau khi SA đã gửi.</summary>
    public static readonly IReadOnlySet<string> AllowedForAcceptInvoice = new HashSet<string>
    {
        InvoiceSent
    };

    /// <summary>Khách hàng thanh toán khi hóa đơn đang ở trạng thái chờ thanh toán.</summary>
    public static readonly IReadOnlySet<string> AllowedForProcessPayment = new HashSet<string>
    {
        PaymentPending
    };

    /// <summary>SA xác nhận đã nhận tiền sau khi khách đã thanh toán.</summary>
    public static readonly IReadOnlySet<string> AllowedForConfirmPayment = new HashSet<string>
    {
        PaymentSubmitted
    };

    /// <summary>Khách hàng khiếu nại hóa đơn khi hóa đơn đã được gửi.</summary>
    public static readonly IReadOnlySet<string> AllowedForDispute = new HashSet<string>
    {
        InvoiceSent
    };

    /// <summary>SA xử lý tranh chấp khi đơn đang ở trạng thái khiếu nại.</summary>
    public static readonly IReadOnlySet<string> AllowedForResolveDispute = new HashSet<string>
    {
        InvoiceDisputed
    };

    /// <summary>Trạng thái không thể hủy thêm lần nữa.</summary>
    public static readonly IReadOnlySet<string> NotCancellable = new HashSet<string>
    {
        Completed,
        Cancelled
    };

    /// <summary>Chỉ cho phép đánh dấu spam ở giai đoạn tiếp nhận ban đầu.</summary>
    public static readonly IReadOnlySet<string> AllowedForMarkSpam = new HashSet<string>
    {
        Pending,
        Reviewing
    };
}

/// <summary>
/// Hằng số loại cứu hộ.
/// </summary>
public static class RescueType
{
    public const string Roadside = "ROADSIDE";
    public const string Towing = "TOWING";
}

/// <summary>
/// Hằng số loại Repair Order tạo từ cứu hộ, dùng cho `CarMaintenance.MaintenanceType`.
/// </summary>
public static class RescueMaintenanceType
{
    /// <summary>
    /// DB hiện chỉ chấp nhận `MaintenanceType = RESCUE` cho mọi hồ sơ phát sinh từ rescue.
    /// Phân biệt roadside hay towing được giữ ở `RescueRequest.RescueType`.
    /// </summary>
    public const string Unified = "RESCUE";

    /// <summary>Sửa chữa tại chỗ ven đường.</summary>
    public const string Roadside = Unified;

    /// <summary>Kéo xe về xưởng.</summary>
    public const string Towing = Unified;
}

/// <summary>
/// Trạng thái Repair Order dùng để validate xe đang có hồ sơ sửa chữa active hay không.
/// </summary>
public static class CarMaintenanceStatus
{
    public const string Waiting = "WAITING";
    public const string Completed = "COMPLETED";
    public const string Cancelled = "CANCELLED";
    public const string RECEIVED = "RECEIVED";
}

/// <summary>
/// Trạng thái hóa đơn cứu hộ, được ánh xạ từ `RescueRequest.Status`.
/// </summary>
public static class InvoiceStatus
{
    public const string Created = "CREATED";
    public const string Sent = "SENT";
    public const string Accepted = "ACCEPTED";
    public const string Paid = "PAID";
    public const string Disputed = "DISPUTED";

    /// <summary>Ánh xạ trạng thái rescue sang trạng thái hóa đơn tương ứng.</summary>
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
/// Phương thức thanh toán hợp lệ cho rescue.
/// </summary>
public static class PaymentMethod
{
    public const string Cash = "CASH";
    public const string Card = "CARD";
    public const string Transfer = "TRANSFER";
    public const string Ewallet = "EWALLET";

    /// <summary>Tập hợp các phương thức thanh toán được hỗ trợ.</summary>
    public static readonly IReadOnlySet<string> ValidMethods = new HashSet<string>
    {
        Cash,
        Card,
        Transfer,
        Ewallet
    };
}

/// <summary>
/// Trạng thái giao dịch thanh toán.
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
/// Hằng số `RoleID` của người dùng trong hệ thống.
/// </summary>
public static class UserRole
{
    public const int Admin = 1;
    public const int ServiceAdvisor = 2;
    public const int Technician = 3;
    public const int Customer = 4;
}
