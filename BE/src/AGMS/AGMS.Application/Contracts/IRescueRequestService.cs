using AGMS.Application.DTOs.Rescue;

namespace AGMS.Application.Contracts;

/// <summary>
/// Contract nghiệp vụ cho module cứu hộ (UC-RES-01 đến UC-RES-06).
/// ActorId (customerId / saId / techId) được truyền riêng — không nằm trong DTO request.
/// </summary>
public interface IRescueRequestService
{
    // -------------------------------------------------------------------------
    // UC-RES-01: Tiếp nhận & Đánh giá
    // -------------------------------------------------------------------------

    /// <summary>
    /// Khách hàng tạo yêu cầu cứu hộ (UC-RES-01 Step 1-2).
    /// customerId lấy từ JWT token. Validate: BR-16 (địa chỉ + mô tả), xe thuộc sở hữu.
    /// </summary>
    Task<RescueRequestDetailDto> CreateAsync(int customerId, CreateRescueRequestDto request, CancellationToken ct);
    Task<RescueDepositResultDto> PayDepositAsync(int rescueId, int customerId, PayRescueDepositDto request, CancellationToken ct);
    Task<RescueDepositResultDto> ConfirmDepositAsync(int rescueId, int saId, CancellationToken ct);

    /// <summary>SA lấy danh sách yêu cầu cứu hộ với bộ lọc (UC-RES-01 Step 3)</summary>
    Task<IEnumerable<RescueRequestListItemDto>> GetListAsync(
        string? status, string? rescueType, int? customerId,
        DateTime? fromDate, DateTime? toDate, CancellationToken ct);

    /// <summary>Xem chi tiết yêu cầu cứu hộ — dùng cho cả SA và Customer (UC-RES-01 Step 3-4)</summary>
    Task<RescueRequestDetailDto> GetDetailAsync(int rescueId, CancellationToken ct);

    /// <summary>
    /// SA lấy danh sách kỹ thuật viên khả dụng (UC-RES-01 Step 4, BR-28).
    /// </summary>
    Task<IEnumerable<AvailableTechnicianDto>> GetAvailableTechniciansAsync(int rescueId, CancellationToken ct);

    /// <summary>
    /// SA gửi đề xuất sửa tại chỗ hoặc kéo xe (UC-RES-01 Step 5-6).
    /// saId lấy từ JWT token. Validate: BR-17, BR-18.
    /// </summary>
    Task<RescueRequestDetailDto> ProposeAsync(int rescueId, int saId, ProposeRescueDto request, CancellationToken ct);

    /// <summary>
    /// Customer chấp nhận đề xuất của SA trước khi chuyển sang bước đặt cọc/điều phối.
    /// customerId lấy từ JWT token.
    /// </summary>
    Task<RescueRequestDetailDto> AcceptProposalAsync(int rescueId, int customerId, CancellationToken ct);

    // -------------------------------------------------------------------------
    // UC-RES-02: Điều phối & Sửa ven đường
    // -------------------------------------------------------------------------

    /// <summary>
    /// SA assign kỹ thuật viên (UC-RES-02 Step 1-2).
    /// saId lấy từ JWT token. Validate: BR-17, BR-18 (PROPOSAL_ACCEPTED + ROADSIDE), BR-28. SMC03, SMC10.
    /// </summary>
    Task<RescueRequestDetailDto> AssignTechnicianAsync(int rescueId, int saId, AssignTechnicianDto request, CancellationToken ct);

    /// <summary>
    /// Technician nhận job (UC-RES-02 Step 3).
    /// techId lấy từ JWT token. BR-18: DISPATCHED → EN_ROUTE. SMC05.
    /// </summary>
    Task<RescueRequestDetailDto> AcceptJobAsync(int rescueId, int techId, CancellationToken ct);

    /// <summary>
    /// Technician báo đã đến hiện trường (UC-RES-02 Step 4).
    /// techId lấy từ JWT token. BR-18: EN_ROUTE → ON_SITE. SMC05.
    /// </summary>
    Task<RescueRequestDetailDto> ArriveAsync(int rescueId, int techId, CancellationToken ct);

    /// <summary>
    /// Ghi nhận chấp thuận/từ chối sửa tại chỗ (UC-RES-02 Step 5, BR-RES-01).
    /// actorId lấy từ JWT token (Customer hoặc SA thay mặt).
    /// consentGiven=false → PROPOSED_TOWING (AF-02).
    /// </summary>
    Task<RescueRequestDetailDto> RecordConsentAsync(int rescueId, int actorId, CustomerConsentDto request, CancellationToken ct);

    /// <summary>
    /// Technician bắt đầu chẩn đoán (UC-RES-02 Step 6).
    /// techId lấy từ JWT token. canRepairOnSite=false → AF-01, release technician.
    /// </summary>
    Task<RescueRequestDetailDto> StartDiagnosisAsync(int rescueId, int techId, StartDiagnosisDto request, CancellationToken ct);

    /// <summary>
    /// Ghi nhận vật tư/dịch vụ sử dụng (UC-RES-02 Step 7, BR-20, SMC08).
    /// Lần gọi đầu: DIAGNOSING → REPAIRING.
    /// </summary>
    Task<RepairItemsResultDto> AddRepairItemsAsync(int rescueId, AddRepairItemsDto request, CancellationToken ct);

    /// <summary>
    /// Technician hoàn thành sửa chữa (UC-RES-02 Step 8).
    /// techId lấy từ JWT token. REPAIRING → REPAIR_COMPLETE. Release technician. SMC05.
    /// </summary>
    Task<RescueRequestDetailDto> CompleteRepairAsync(int rescueId, int techId, CompleteRepairDto request, CancellationToken ct);

    // -------------------------------------------------------------------------
    // UC-RES-03: Dịch vụ kéo xe
    // -------------------------------------------------------------------------

    /// <summary>
    /// SA điều phối dịch vụ kéo xe (UC-RES-03 C1).
    /// saId lấy từ JWT token. PROPOSAL_ACCEPTED + TOWING → TOWING_DISPATCHED. SMC05, SMC11.
    /// </summary>
    Task<TowingDispatchResultDto> DispatchTowingAsync(int rescueId, int saId, DispatchTowingDto request, CancellationToken ct);

    /// <summary>
    /// Customer chấp nhận dịch vụ kéo xe (UC-RES-03 C2).
    /// customerId lấy từ JWT token. TOWING_DISPATCHED → TOWING_ACCEPTED.
    /// Từ chối → gọi cancel (UC-RES-06).
    /// </summary>
    Task<RescueRequestDetailDto> AcceptTowingAsync(int rescueId, int customerId, CancellationToken ct);

    /// <summary>
    /// SA hoàn tất kéo xe — tạo Repair Order tự động (UC-RES-03 C3).
    /// saId lấy từ JWT token. TOWING_ACCEPTED → TOWED. BR-19. SMC07.
    /// </summary>
    Task<CompleteTowingResultDto> CompleteTowingAsync(int rescueId, int saId, CompleteTowingDto request, CancellationToken ct);

    // -------------------------------------------------------------------------
    // UC-RES-04: Hóa đơn & Thanh toán
    // -------------------------------------------------------------------------

    /// <summary>
    /// SA tạo hóa đơn cứu hộ (UC-RES-04 D1).
    /// saId lấy từ JWT token. BR-24: tính member discount. SMP02, SMP06.
    /// </summary>
    Task<CreateInvoiceResultDto> CreateInvoiceAsync(int rescueId, int saId, CreateInvoiceDto request, CancellationToken ct);

    /// <summary>Lấy thông tin hóa đơn và danh sách vật tư/dịch vụ (UC-RES-04 D2)</summary>
    Task<InvoiceWithItemsResponseDto> GetInvoiceAsync(int rescueId, CancellationToken ct);

    /// <summary>
    /// SA gửi hóa đơn cho Customer (UC-RES-04 D3).
    /// saId lấy từ JWT token. INVOICED → INVOICE_SENT. BR-25. SMC05.
    /// </summary>
    Task<SendInvoiceResultDto> SendInvoiceAsync(int rescueId, int saId, CancellationToken ct);

    /// <summary>
    /// Customer chấp nhận hóa đơn (UC-RES-04 D4).
    /// customerId lấy từ JWT token. INVOICE_SENT → PAYMENT_PENDING.
    /// Khiếu nại → gọi dispute (UC-RES-05).
    /// </summary>
    Task<AcceptInvoiceResultDto> AcceptInvoiceAsync(int rescueId, int customerId, CancellationToken ct);

    /// <summary>
    /// Customer thanh toán (UC-RES-04 D5).
    /// customerId lấy từ JWT token. PAYMENT_PENDING → PAYMENT_SUBMITTED.
    /// Validate: amount = finalAmount (BR-23), method hợp lệ (SMP07). SMP03, SMP05.
    /// </summary>
    Task<PaymentResultDto> ProcessPaymentAsync(int rescueId, int customerId, ProcessPaymentDto request, CancellationToken ct);

    /// <summary>
    /// SA xác nhận đã nhận tiền sau khi customer thanh toán.
    /// saId lấy từ JWT token. PAYMENT_SUBMITTED → COMPLETED.
    /// </summary>
    Task<PaymentResultDto> ConfirmPaymentAsync(int rescueId, int saId, CancellationToken ct);

    // -------------------------------------------------------------------------
    // UC-RES-05: Tranh chấp hóa đơn
    // -------------------------------------------------------------------------

    /// <summary>
    /// Customer tạo khiếu nại hóa đơn (UC-RES-05 E1).
    /// customerId lấy từ JWT token. INVOICE_SENT → INVOICE_DISPUTED. BR-26. SMC12.
    /// </summary>
    Task<DisputeCreatedResultDto> CreateDisputeAsync(int rescueId, int customerId, CreateDisputeDto request, CancellationToken ct);

    /// <summary>
    /// SA xử lý tranh chấp và gửi lại hóa đơn (UC-RES-05 E2).
    /// saId lấy từ JWT token. INVOICE_DISPUTED → INVOICE_SENT. BR-26.
    /// </summary>
    Task<ResolveDisputeResultDto> ResolveDisputeAsync(int rescueId, int saId, ResolveDisputeDto request, CancellationToken ct);

    // -------------------------------------------------------------------------
    // UC-RES-06: Hủy / Spam
    // -------------------------------------------------------------------------

    /// <summary>
    /// SA hủy yêu cầu cứu hộ (UC-RES-06 F1).
    /// saId lấy từ JWT token. Bất kỳ trạng thái (trừ COMPLETED) → CANCELLED. BR-26. SMC06.
    /// </summary>
    Task<CancelRescueResultDto> CancelAsync(int rescueId, int saId, CancelRescueDto request, CancellationToken ct);

    /// <summary>
    /// SA đánh dấu Spam (UC-RES-06 F2).
    /// saId lấy từ JWT token. PENDING/REVIEWING → CANCELLED. BR-26. SMC14, SMC06.
    /// </summary>
    Task<MarkSpamResultDto> MarkSpamAsync(int rescueId, int saId, MarkSpamDto request, CancellationToken ct);
}
