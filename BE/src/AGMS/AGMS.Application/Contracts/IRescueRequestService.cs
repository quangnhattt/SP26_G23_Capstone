using AGMS.Application.DTOs.Rescue;

namespace AGMS.Application.Contracts;

/// <summary>
/// Contract nghiệp vụ cho module cứu hộ (UC-RES-01 đến UC-RES-03)
/// </summary>
public interface IRescueRequestService
{
    /// <summary>
    /// Khách hàng tạo yêu cầu cứu hộ (UC-RES-01 Step 1-2)
    /// Validate: BR-16 (địa chỉ + mô tả bắt buộc), xe thuộc sở hữu khách hàng
    /// </summary>
    Task<RescueRequestDetailDto> CreateAsync(CreateRescueRequestDto request, CancellationToken ct);

    /// <summary>
    /// SA lấy danh sách yêu cầu cứu hộ với bộ lọc (UC-RES-01 Step 3)
    /// </summary>
    Task<IEnumerable<RescueRequestListItemDto>> GetListAsync(
        string? status, string? rescueType, int? customerId,
        DateTime? fromDate, DateTime? toDate, CancellationToken ct);

    /// <summary>
    /// Xem chi tiết yêu cầu cứu hộ — dùng cho cả SA và Customer (UC-RES-01 Step 3-4)
    /// </summary>
    Task<RescueRequestDetailDto> GetDetailAsync(int rescueId, CancellationToken ct);

    /// <summary>
    /// SA lấy danh sách kỹ thuật viên khả dụng để tham chiếu khi đánh giá (UC-RES-01 Step 4, BR-28)
    /// </summary>
    Task<IEnumerable<AvailableTechnicianDto>> GetAvailableTechniciansAsync(int rescueId, CancellationToken ct);

    /// <summary>
    /// SA gửi đề xuất sửa tại chỗ hoặc kéo xe cho khách hàng (UC-RES-01 Step 5-6)
    /// Validate: BR-17 (SA có quyền), BR-18 (status workflow)
    /// </summary>
    Task<RescueRequestDetailDto> ProposeAsync(int rescueId, ProposeRescueDto request, CancellationToken ct);

    // -------------------------------------------------------------------------
    // UC-RES-02: Điều phối & Sửa ven đường
    // -------------------------------------------------------------------------

    /// <summary>
    /// SA assign kỹ thuật viên và đặt trước cho nhiệm vụ cứu hộ (UC-RES-02 Step 1-2).
    /// Validate: BR-17 (chỉ SA), BR-18 (PROPOSED_ROADSIDE), technician rảnh (BR-28).
    /// Status: PROPOSED_ROADSIDE → DISPATCHED. SMC03, SMC10.
    /// </summary>
    Task<RescueRequestDetailDto> AssignTechnicianAsync(int rescueId, AssignTechnicianDto request, CancellationToken ct);

    /// <summary>
    /// Technician nhận job và xác nhận đang trên đường (UC-RES-02 Step 3).
    /// Validate: BR-18 (DISPATCHED), phải là assigned technician.
    /// Status: DISPATCHED → EN_ROUTE. SMC05.
    /// </summary>
    Task<RescueRequestDetailDto> AcceptJobAsync(int rescueId, TechnicianActionDto request, CancellationToken ct);

    /// <summary>
    /// Technician báo đã đến hiện trường (UC-RES-02 Step 4).
    /// Validate: BR-18 (EN_ROUTE), phải là assigned technician.
    /// Status: EN_ROUTE → ON_SITE. SMC05.
    /// </summary>
    Task<RescueRequestDetailDto> ArriveAsync(int rescueId, TechnicianActionDto request, CancellationToken ct);

    /// <summary>
    /// Ghi nhận sự chấp thuận/từ chối sửa chữa tại chỗ của Customer (UC-RES-02 Step 5, BR-RES-01).
    /// consentGiven=true → ON_SITE (tiếp tục chẩn đoán).
    /// consentGiven=false → PROPOSED_TOWING (AF-02, chuyển sang UC-RES-03).
    /// </summary>
    Task<RescueRequestDetailDto> RecordConsentAsync(int rescueId, CustomerConsentDto request, CancellationToken ct);

    /// <summary>
    /// Technician bắt đầu chẩn đoán tại chỗ (UC-RES-02 Step 6).
    /// canRepairOnSite=true → tạo Repair Order (BR-07, BR-11), status → DIAGNOSING.
    /// canRepairOnSite=false → PROPOSED_TOWING (AF-01), release technician.
    /// </summary>
    Task<RescueRequestDetailDto> StartDiagnosisAsync(int rescueId, StartDiagnosisDto request, CancellationToken ct);

    /// <summary>
    /// Ghi nhận vật tư/dịch vụ sử dụng trong quá trình sửa chữa (UC-RES-02 Step 7, BR-20).
    /// Lần gọi đầu: status → REPAIRING. Trả về toàn bộ items đã ghi + subtotal. SMC08.
    /// </summary>
    Task<RepairItemsResultDto> AddRepairItemsAsync(int rescueId, AddRepairItemsDto request, CancellationToken ct);

    /// <summary>
    /// Technician hoàn thành sửa chữa và báo cáo SA (UC-RES-02 Step 8).
    /// Status: REPAIRING → REPAIR_COMPLETE. Release technician (IsOnRescueMission=false). SMC05.
    /// </summary>
    Task<RescueRequestDetailDto> CompleteRepairAsync(int rescueId, CompleteRepairDto request, CancellationToken ct);

    // -------------------------------------------------------------------------
    // UC-RES-03: Dịch vụ kéo xe
    // -------------------------------------------------------------------------

    /// <summary>
    /// SA điều phối dịch vụ kéo xe (UC-RES-03 Step 1-2).
    /// Validate: BR-17 (chỉ SA), BR-18 (PROPOSED_TOWING).
    /// Status: PROPOSED_TOWING → TOWING_DISPATCHED. SMC05, SMC11.
    /// </summary>
    Task<TowingDispatchResultDto> DispatchTowingAsync(int rescueId, DispatchTowingDto request, CancellationToken ct);

    /// <summary>
    /// Customer chấp nhận dịch vụ kéo xe (UC-RES-03 Step 3).
    /// Validate: BR-18 (TOWING_DISPATCHED), phải là CustomerID của rescue.
    /// Status: TOWING_DISPATCHED → TOWING_ACCEPTED.
    /// AF-01: Customer từ chối → gọi cancel endpoint (UC-RES-06).
    /// </summary>
    Task<RescueRequestDetailDto> AcceptTowingAsync(int rescueId, AcceptTowingDto request, CancellationToken ct);

    /// <summary>
    /// SA hoàn tất kéo xe và tạo Repair Order tự động (UC-RES-03 Step 4).
    /// Validate: BR-17 (chỉ SA), BR-18 (TOWING_ACCEPTED), BR-11 (không có active RO).
    /// Status: TOWING_ACCEPTED → TOWED. BR-19: tạo CarMaintenance RESCUE_TOWING. SMC07.
    /// </summary>
    Task<CompleteTowingResultDto> CompleteTowingAsync(int rescueId, CompleteTowingDto request, CancellationToken ct);
}
