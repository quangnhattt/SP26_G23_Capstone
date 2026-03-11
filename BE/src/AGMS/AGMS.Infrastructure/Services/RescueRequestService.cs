using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Rescue;
using AGMS.Domain.Entities;

namespace AGMS.Infrastructure.Services;

public class RescueRequestService : IRescueRequestService
{
    private readonly IRescueRequestRepository _rescueRepo;
    private readonly IUserRepository _userRepo;

    public RescueRequestService(
        IRescueRequestRepository rescueRepo,
        IUserRepository userRepo)
    {
        _rescueRepo = rescueRepo;
        _userRepo   = userRepo;
    }

    /// <summary>
    /// Khách hàng tạo yêu cầu cứu hộ (UC-RES-01 Step 1-2).
    /// Validate: BR-16 (địa chỉ + mô tả bắt buộc đã được DataAnnotation xử lý),
    ///           xe tồn tại, khách hàng hợp lệ, xe thuộc sở hữu khách hàng.
    /// </summary>
    public async Task<RescueRequestDetailDto> CreateAsync(CreateRescueRequestDto request, CancellationToken ct)
    {
        // Validate xe tồn tại
        var car = await _rescueRepo.GetCarByIdAsync(request.CarId, ct)
            ?? throw new KeyNotFoundException("Xe không tồn tại.");

        // Validate khách hàng tồn tại và đúng role
        var customer = await _userRepo.GetByIdAsync(request.CustomerId, ct)
            ?? throw new KeyNotFoundException("Khách hàng không tồn tại.");

        if (customer.RoleID != UserRole.Customer)
            throw new ArgumentException("Người dùng không có quyền tạo yêu cầu cứu hộ.");

        // Validate xe thuộc sở hữu khách hàng
        if (car.OwnerID != request.CustomerId)
            throw new ArgumentException("Xe không thuộc sở hữu của khách hàng này.");

        var rescue = new RescueRequest
        {
            CarID              = request.CarId,
            CustomerID         = request.CustomerId,
            CurrentAddress     = request.CurrentAddress.Trim(),
            ProblemDescription = request.ProblemDescription.Trim(),
            Latitude           = request.Latitude,
            Longitude          = request.Longitude,
            ImageEvidence      = string.IsNullOrWhiteSpace(request.ImageEvidence)
                                     ? null
                                     : request.ImageEvidence.Trim(),
            Status             = RescueStatus.Pending,
            ServiceFee         = 0,
            CreatedDate        = DateTime.UtcNow
        };

        await _rescueRepo.AddAsync(rescue, ct);

        // Tải lại với navigation properties để map sang DTO đầy đủ
        var created = await _rescueRepo.GetByIdAsync(rescue.RescueID, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ vừa tạo.");

        return MapToDetail(created);
    }

    /// <summary>
    /// SA lấy danh sách yêu cầu cứu hộ với bộ lọc (UC-RES-01 Step 3).
    /// Delegate thẳng xuống repository vì không có logic nghiệp vụ phức tạp.
    /// </summary>
    public async Task<IEnumerable<RescueRequestListItemDto>> GetListAsync(
        string? status, string? rescueType, int? customerId,
        DateTime? fromDate, DateTime? toDate, CancellationToken ct)
    {
        return await _rescueRepo.GetListAsync(status, rescueType, customerId, fromDate, toDate, ct);
    }

    /// <summary>
    /// Xem chi tiết yêu cầu cứu hộ (UC-RES-01 Step 3-4).
    /// Dùng cho cả SA lẫn Customer.
    /// </summary>
    public async Task<RescueRequestDetailDto> GetDetailAsync(int rescueId, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        return MapToDetail(rescue);
    }

    /// <summary>
    /// SA lấy danh sách kỹ thuật viên khả dụng để tham chiếu khi đánh giá (UC-RES-01 Step 4, BR-28).
    /// Validate rescue tồn tại để đảm bảo ngữ cảnh hợp lệ.
    /// </summary>
    public async Task<IEnumerable<AvailableTechnicianDto>> GetAvailableTechniciansAsync(int rescueId, CancellationToken ct)
    {
        // Validate yêu cầu cứu hộ tồn tại
        _ = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        return await _rescueRepo.GetAvailableTechniciansAsync(ct);
    }

    /// <summary>
    /// SA gửi đề xuất hướng xử lý: sửa tại chỗ hoặc kéo xe (UC-RES-01 Step 5-6).
    /// Validate: BR-17 (chỉ SA được propose), BR-18 (status phải là PENDING hoặc REVIEWING).
    /// Status transition: PENDING/REVIEWING → PROPOSED_ROADSIDE hoặc PROPOSED_TOWING.
    /// </summary>
    public async Task<RescueRequestDetailDto> ProposeAsync(int rescueId, ProposeRescueDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForPropose.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể gửi đề xuất. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PENDING hoặc REVIEWING.");

        // Validate SA tồn tại và đúng role (BR-17)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");

        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền gửi đề xuất cứu hộ.");

        // Xác định trạng thái mới theo loại cứu hộ
        var newStatus = request.RescueType.ToUpperInvariant() == RescueType.Roadside
            ? RescueStatus.ProposedRoadside
            : RescueStatus.ProposedTowing;

        // Cập nhật entity (AsNoTracking nên dùng UpdateAsync theo pattern của project)
        rescue.ServiceAdvisorID = request.ServiceAdvisorId;
        rescue.RescueType       = request.RescueType.ToUpperInvariant();
        rescue.ServiceFee       = request.EstimatedServiceFee ?? rescue.ServiceFee;
        rescue.Status           = newStatus;

        await _rescueRepo.UpdateAsync(rescue, ct);

        // Tải lại để trả về DTO đầy đủ với navigation properties
        var updated = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");

        return MapToDetail(updated);
    }

    // =========================================================================
    // UC-RES-02: Điều phối & Sửa ven đường
    // =========================================================================

    /// <summary>
    /// SA assign kỹ thuật viên cho nhiệm vụ cứu hộ (UC-RES-02 Step 1-2).
    /// BR-17: chỉ SA được assign. BR-18: chỉ từ PROPOSED_ROADSIDE.
    /// BR-28: technician phải rảnh. SMC03 + SMC10.
    /// Status: PROPOSED_ROADSIDE → DISPATCHED.
    /// </summary>
    public async Task<RescueRequestDetailDto> AssignTechnicianAsync(int rescueId, AssignTechnicianDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForAssignTechnician.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể assign kỹ thuật viên. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PROPOSED_ROADSIDE.");

        // Validate SA (BR-17 — SMC04: Only Service Advisors can assign technicians)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền điều phối kỹ thuật viên.");

        // Validate kỹ thuật viên tồn tại và đang rảnh (BR-28)
        var tech = await _userRepo.GetByIdAsync(request.TechnicianId, ct)
            ?? throw new KeyNotFoundException("Kỹ thuật viên không tồn tại.");
        if (tech.RoleID != UserRole.Technician)
            throw new ArgumentException("Người dùng không phải kỹ thuật viên.");
        if (!tech.IsActive)
            throw new InvalidOperationException("Kỹ thuật viên không còn hoạt động.");
        if (tech.IsOnRescueMission)
            throw new InvalidOperationException("Kỹ thuật viên đang trong một nhiệm vụ cứu hộ khác.");

        // Cập nhật rescue: DISPATCHED + gán technician (SMC05)
        rescue.AssignedTechnicianID     = request.TechnicianId;
        rescue.EstimatedArrivalDateTime = request.EstimatedArrivalDateTime;
        rescue.Status                   = RescueStatus.Dispatched;
        await _rescueRepo.UpdateAsync(rescue, ct);

        // Đặt trước kỹ thuật viên — đánh dấu đang trong nhiệm vụ (SMC10: Reserve technician)
        await _userRepo.SetOnRescueMissionAsync(request.TechnicianId, true, ct);

        var updated = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");
        return MapToDetail(updated);
    }

    /// <summary>
    /// Technician nhận job và xác nhận đang trên đường (UC-RES-02 Step 3).
    /// Validate: phải là assigned technician, BR-18 (DISPATCHED). SMC05.
    /// Status: DISPATCHED → EN_ROUTE.
    /// </summary>
    public async Task<RescueRequestDetailDto> AcceptJobAsync(int rescueId, TechnicianActionDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForAcceptJob.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể nhận job. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: DISPATCHED.");

        // Validate đúng kỹ thuật viên được assign
        if (rescue.AssignedTechnicianID != request.TechnicianId)
            throw new ArgumentException("Bạn không phải kỹ thuật viên được phân công cho yêu cầu này.");

        rescue.Status = RescueStatus.EnRoute;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");
        return MapToDetail(updated);
    }

    /// <summary>
    /// Technician báo đã đến hiện trường xe (UC-RES-02 Step 4). SMC05.
    /// Status: EN_ROUTE → ON_SITE.
    /// </summary>
    public async Task<RescueRequestDetailDto> ArriveAsync(int rescueId, TechnicianActionDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForArrive.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể cập nhật trạng thái đến nơi. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: EN_ROUTE.");

        if (rescue.AssignedTechnicianID != request.TechnicianId)
            throw new ArgumentException("Bạn không phải kỹ thuật viên được phân công cho yêu cầu này.");

        rescue.Status = RescueStatus.OnSite;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");
        return MapToDetail(updated);
    }

    /// <summary>
    /// Ghi nhận chấp thuận/từ chối sửa chữa tại chỗ của Customer (UC-RES-02 Step 5, BR-RES-01).
    /// consentGiven=true → giữ ON_SITE, tiếp tục chẩn đoán.
    /// consentGiven=false → PROPOSED_TOWING (AF-02), release technician.
    /// </summary>
    public async Task<RescueRequestDetailDto> RecordConsentAsync(int rescueId, CustomerConsentDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForConsent.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể ghi nhận chấp thuận. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: ON_SITE.");

        if (!request.ConsentGiven)
        {
            // AF-02: Khách hàng từ chối → chuyển sang đề xuất kéo xe, release technician
            rescue.Status = RescueStatus.ProposedTowing;
            await _rescueRepo.UpdateAsync(rescue, ct);

            if (rescue.AssignedTechnicianID.HasValue)
                await _userRepo.SetOnRescueMissionAsync(rescue.AssignedTechnicianID.Value, false, ct);
        }
        // consentGiven=true: không thay đổi status, tiếp tục flow UC-RES-02

        var updated = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");
        return MapToDetail(updated);
    }

    /// <summary>
    /// Technician bắt đầu chẩn đoán tại hiện trường (UC-RES-02 Step 6).
    /// canRepairOnSite=true → tạo Repair Order (BR-07, BR-11 check), status → DIAGNOSING.
    /// canRepairOnSite=false → AF-01: PROPOSED_TOWING, release technician.
    /// </summary>
    public async Task<RescueRequestDetailDto> StartDiagnosisAsync(int rescueId, StartDiagnosisDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForDiagnosis.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể bắt đầu chẩn đoán. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: ON_SITE.");

        if (rescue.AssignedTechnicianID != request.TechnicianId)
            throw new ArgumentException("Bạn không phải kỹ thuật viên được phân công cho yêu cầu này.");

        if (!request.CanRepairOnSite)
        {
            // AF-01: Không thể sửa tại chỗ → chuyển sang kéo xe, release technician
            rescue.Status = RescueStatus.ProposedTowing;
            await _rescueRepo.UpdateAsync(rescue, ct);

            if (rescue.AssignedTechnicianID.HasValue)
                await _userRepo.SetOnRescueMissionAsync(rescue.AssignedTechnicianID.Value, false, ct);

            var notFixed = await _rescueRepo.GetByIdAsync(rescueId, ct)
                ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");
            return MapToDetail(notFixed);
        }

        // Kiểm tra xe chưa có Repair Order active (BR-11 — SMR11: Duplicate active RO)
        if (await _rescueRepo.HasActiveMaintenanceForCarAsync(rescue.CarID, ct))
            throw new InvalidOperationException("Xe đã có Repair Order đang xử lý. Không thể tạo thêm. (BR-11)");

        // Tạo Repair Order mới cho sửa chữa ven đường (BR-07, SMR07)
        var maintenance = new CarMaintenance
        {
            CarID           = rescue.CarID,
            MaintenanceType = RescueMaintenanceType.Roadside,
            Status          = CarMaintenanceStatus.Waiting,
            Notes           = request.DiagnosisNotes.Trim(),
            CreatedBy       = request.TechnicianId,
            AssignedTechnicianID = request.TechnicianId,
            TotalAmount     = 0,
            DiscountAmount  = 0,
            MemberDiscountAmount  = 0,
            MemberDiscountPercent = 0,
            MaintenanceDate = DateTime.UtcNow,
            CreatedDate     = DateTime.UtcNow
        };
        var created = await _rescueRepo.CreateMaintenanceAsync(maintenance, ct);

        // Liên kết Repair Order vào rescue + chuyển status DIAGNOSING
        rescue.ResultingMaintenanceID = created.MaintenanceID;
        rescue.Status                 = RescueStatus.Diagnosing;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");
        return MapToDetail(updated);
    }

    /// <summary>
    /// Ghi nhận vật tư/dịch vụ sử dụng trong quá trình sửa chữa (UC-RES-02 Step 7, BR-20, SMC08).
    /// Lần gọi đầu tiên (DIAGNOSING → REPAIRING): chuyển trạng thái rescue.
    /// Trả về toàn bộ danh sách items đã ghi + subtotal.
    /// </summary>
    public async Task<RepairItemsResultDto> AddRepairItemsAsync(int rescueId, AddRepairItemsDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForRepairItems.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể ghi vật tư. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: DIAGNOSING hoặc REPAIRING.");

        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException("Chưa có Repair Order. Vui lòng hoàn tất bước chẩn đoán trước.");

        var maintenanceId = rescue.ResultingMaintenanceID.Value;

        // Validate và thêm từng vật tư/dịch vụ (BR-20)
        foreach (var item in request.Items)
        {
            var product = await _rescueRepo.GetProductByIdAsync(item.ProductId, ct)
                ?? throw new KeyNotFoundException($"Sản phẩm ID={item.ProductId} không tồn tại hoặc không còn hoạt động.");

            var serviceDetail = new ServiceDetail
            {
                MaintenanceID = maintenanceId,
                ProductID     = item.ProductId,
                Quantity      = item.Quantity,
                UnitPrice     = item.UnitPrice,
                ItemStatus    = "APPROVED",
                IsAdditional  = false,
                FromPackage   = false,
                Notes         = item.Notes?.Trim()
            };
            await _rescueRepo.AddServiceDetailAsync(serviceDetail, ct);
        }

        // Lần gọi đầu tiên (DIAGNOSING): chuyển sang REPAIRING
        if (rescue.Status == RescueStatus.Diagnosing)
        {
            rescue.Status = RescueStatus.Repairing;
            await _rescueRepo.UpdateAsync(rescue, ct);
        }

        // Tổng hợp danh sách items và tính subtotal
        var allItems = (await _rescueRepo.GetRepairItemsAsync(maintenanceId, ct)).ToList();
        var subtotal = allItems.Sum(i => i.TotalPrice);

        // Cập nhật TotalAmount trong Repair Order
        var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(maintenanceId, ct);
        if (maintenance != null)
        {
            maintenance.TotalAmount = subtotal;
            await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
        }

        return new RepairItemsResultDto
        {
            RescueId      = rescueId,
            Status        = rescue.Status == RescueStatus.Diagnosing ? RescueStatus.Repairing : rescue.Status,
            MaintenanceId = maintenanceId,
            RepairItems   = allItems,
            Subtotal      = subtotal
        };
    }

    /// <summary>
    /// Technician hoàn thành sửa chữa và báo cáo SA (UC-RES-02 Step 8).
    /// Status: REPAIRING → REPAIR_COMPLETE. Release technician (IsOnRescueMission=false). SMC05.
    /// </summary>
    public async Task<RescueRequestDetailDto> CompleteRepairAsync(int rescueId, CompleteRepairDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForCompleteRepair.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể hoàn thành sửa chữa. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: REPAIRING.");

        if (rescue.AssignedTechnicianID != request.TechnicianId)
            throw new ArgumentException("Bạn không phải kỹ thuật viên được phân công cho yêu cầu này.");

        // Lưu ghi chú hoàn thành vào Repair Order
        if (rescue.ResultingMaintenanceID.HasValue && !string.IsNullOrWhiteSpace(request.CompletionNotes))
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct);
            if (maintenance != null)
            {
                // Nối thêm ghi chú hoàn thành vào sau ghi chú chẩn đoán hiện có
                var existingNotes = string.IsNullOrWhiteSpace(maintenance.Notes) ? "" : maintenance.Notes + "\n";
                maintenance.Notes = existingNotes + $"[Hoàn thành] {request.CompletionNotes.Trim()}";
                await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
            }
        }

        // Chuyển trạng thái REPAIR_COMPLETE, release technician
        rescue.Status = RescueStatus.RepairComplete;
        await _rescueRepo.UpdateAsync(rescue, ct);

        await _userRepo.SetOnRescueMissionAsync(request.TechnicianId, false, ct);

        var updated = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");
        return MapToDetail(updated);
    }

    // =========================================================================
    // UC-RES-03: Dịch vụ kéo xe
    // =========================================================================

    /// <summary>
    /// SA điều phối dịch vụ kéo xe (UC-RES-03 Step 1-2).
    /// BR-17: chỉ SA. BR-18: chỉ từ PROPOSED_TOWING. SMC05, SMC11.
    /// Status: PROPOSED_TOWING → TOWING_DISPATCHED.
    /// Lưu ý: TowingNotes được echo từ request (entity không có field riêng).
    /// </summary>
    public async Task<TowingDispatchResultDto> DispatchTowingAsync(int rescueId, DispatchTowingDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForDispatchTowing.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể điều phối kéo xe. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PROPOSED_TOWING.");

        // Validate SA tồn tại và đúng role (BR-17 — SMC04)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền điều phối dịch vụ kéo xe.");

        // Cập nhật rescue: chuyển type về TOWING và status → TOWING_DISPATCHED (SMC05, SMC11)
        rescue.RescueType               = RescueType.Towing;
        rescue.Status                   = RescueStatus.TowingDispatched;
        rescue.ServiceFee               = request.TowingServiceFee ?? rescue.ServiceFee;
        rescue.EstimatedArrivalDateTime = request.EstimatedArrival;
        await _rescueRepo.UpdateAsync(rescue, ct);

        // Echo lại thông tin điều phối trong response (TowingNotes không persist vào entity)
        return new TowingDispatchResultDto
        {
            RescueId        = rescueId,
            Status          = RescueStatus.TowingDispatched,
            RescueType      = RescueType.Towing,
            TowingNotes     = request.TowingNotes,
            EstimatedArrival = request.EstimatedArrival,
            TowingServiceFee = request.TowingServiceFee
        };
    }

    /// <summary>
    /// Customer chấp nhận dịch vụ kéo xe (UC-RES-03 Step 3).
    /// BR-18: chỉ từ TOWING_DISPATCHED. Validate phải là CustomerID của rescue.
    /// Status: TOWING_DISPATCHED → TOWING_ACCEPTED.
    /// AF-01: Customer từ chối → gọi cancel endpoint (UC-RES-06) — không xử lý ở đây.
    /// </summary>
    public async Task<RescueRequestDetailDto> AcceptTowingAsync(int rescueId, AcceptTowingDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForAcceptTowing.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể chấp nhận kéo xe. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: TOWING_DISPATCHED.");

        // Validate đúng khách hàng sở hữu rescue (BR-03)
        if (rescue.CustomerID != request.CustomerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        rescue.Status = RescueStatus.TowingAccepted;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ sau khi cập nhật.");
        return MapToDetail(updated);
    }

    /// <summary>
    /// SA hoàn tất kéo xe và tạo Repair Order tự động (UC-RES-03 Step 4).
    /// BR-17: chỉ SA. BR-18: chỉ từ TOWING_ACCEPTED. BR-11: xe không có active RO.
    /// BR-19: tạo CarMaintenance RESCUE_TOWING → liên kết ResultingMaintenanceID. SMC07.
    /// Status: TOWING_ACCEPTED → TOWED.
    /// </summary>
    public async Task<CompleteTowingResultDto> CompleteTowingAsync(int rescueId, CompleteTowingDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForCompleteTowing.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể hoàn tất kéo xe. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: TOWING_ACCEPTED.");

        // Validate SA tồn tại và đúng role (BR-17)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền hoàn tất dịch vụ kéo xe.");

        // Kiểm tra xe chưa có Repair Order active (BR-11 — SMR11)
        if (await _rescueRepo.HasActiveMaintenanceForCarAsync(rescue.CarID, ct))
            throw new InvalidOperationException("Xe đã có Repair Order đang xử lý. Không thể tạo thêm. (BR-11)");

        // Tạo Repair Order cho kéo xe về xưởng (BR-19 — SMC07, SMR07)
        var now = DateTime.UtcNow;
        var maintenance = new Domain.Entities.CarMaintenance
        {
            CarID                 = rescue.CarID,
            MaintenanceType       = RescueMaintenanceType.Towing,
            Status                = CarMaintenanceStatus.Waiting,
            Notes                 = string.IsNullOrWhiteSpace(request.RepairOrderNotes)
                                        ? null
                                        : request.RepairOrderNotes.Trim(),
            CreatedBy             = request.ServiceAdvisorId,
            TotalAmount           = 0,
            DiscountAmount        = 0,
            MemberDiscountAmount  = 0,
            MemberDiscountPercent = 0,
            MaintenanceDate       = now,
            CreatedDate           = now
        };
        var created = await _rescueRepo.CreateMaintenanceAsync(maintenance, ct);

        // Liên kết Repair Order vào rescue + đánh dấu xe đã được kéo về
        rescue.ResultingMaintenanceID = created.MaintenanceID;
        rescue.Status                 = RescueStatus.Towed;
        rescue.CompletedDate          = now;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new CompleteTowingResultDto
        {
            RescueId = rescueId,
            Status   = RescueStatus.Towed,
            ResultingMaintenance = new TowingMaintenanceDto
            {
                MaintenanceId   = created.MaintenanceID,
                MaintenanceType = created.MaintenanceType,
                Status          = created.Status,
                CreatedDate     = created.CreatedDate
            }
        };
    }

    // =========================================================================
    // UC-RES-04: Hóa đơn & Thanh toán
    // =========================================================================

    /// <summary>
    /// SA tạo hóa đơn cứu hộ (UC-RES-04 D1).
    /// BR-17: chỉ SA. BR-18: REPAIR_COMPLETE hoặc TOWED.
    /// BR-24: tự động tính member discount từ Customer.CurrentRank. SMP02, SMP06.
    /// Status: → INVOICED. Lưu các trường tài chính vào CarMaintenance.
    /// </summary>
    public async Task<CreateInvoiceResultDto> CreateInvoiceAsync(int rescueId, CreateInvoiceDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForCreateInvoice.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể tạo hóa đơn. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: REPAIR_COMPLETE hoặc TOWED.");

        // Validate SA (BR-17)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền tạo hóa đơn cứu hộ.");

        // Validate Repair Order tồn tại (phải có ResultingMaintenanceID)
        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException("Chưa có Repair Order liên kết. Không thể tạo hóa đơn.");

        // Validate manualDiscount không vượt baseAmount
        if (request.ManualDiscount > request.RescueServiceFee)
            throw new ArgumentException("Giảm giá thủ công không được vượt quá tổng phí dịch vụ.");

        // BR-24: Tính member discount tự động từ hạng thành viên hiện tại của khách
        var rank             = rescue.Customer?.CurrentRank;
        var memberPercent    = rank?.DiscountPercent ?? 0m;
        var memberAmount     = Math.Round(request.RescueServiceFee * memberPercent / 100m, 2);
        var finalAmount      = request.RescueServiceFee - request.ManualDiscount - memberAmount;

        var now = DateTime.UtcNow;

        // Cập nhật CarMaintenance với thông tin hóa đơn (TotalAmount = baseAmount theo convention)
        var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct)
            ?? throw new InvalidOperationException("Repair Order không tồn tại.");

        maintenance.TotalAmount           = request.RescueServiceFee;
        maintenance.DiscountAmount        = request.ManualDiscount;
        maintenance.MemberDiscountPercent = memberPercent;
        maintenance.MemberDiscountAmount  = memberAmount;
        maintenance.FinalAmount           = finalAmount;
        maintenance.RankAtTimeOfService   = rank?.RankName;
        maintenance.Notes                 = string.IsNullOrWhiteSpace(request.Notes)
                                               ? maintenance.Notes
                                               : request.Notes.Trim();
        await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);

        // Cập nhật rescue: ServiceFee = baseAmount, Status = INVOICED
        rescue.ServiceFee = request.RescueServiceFee;
        rescue.Status     = RescueStatus.Invoiced;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new CreateInvoiceResultDto
        {
            RescueId = rescueId,
            Status   = RescueStatus.Invoiced,
            Invoice  = MapToInvoiceDetail(maintenance, RescueStatus.Invoiced, now)
        };
    }

    /// <summary>
    /// Lấy thông tin hóa đơn và danh sách vật tư/dịch vụ (UC-RES-04 D2).
    /// Rescue phải đã ở trạng thái INVOICED trở lên. Dùng cho cả SA lẫn Customer.
    /// </summary>
    public async Task<InvoiceWithItemsResponseDto> GetInvoiceAsync(int rescueId, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException("Rescue chưa có Repair Order. Hóa đơn chưa được tạo.");

        var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct)
            ?? throw new InvalidOperationException("Repair Order không tồn tại.");

        // Lấy danh sách vật tư/dịch vụ đã ghi nhận (BR-20)
        var repairItems = await _rescueRepo.GetRepairItemsAsync(rescue.ResultingMaintenanceID.Value, ct);

        var invoiceDetail = MapToInvoiceDetail(maintenance, rescue.Status, maintenance.CreatedDate);

        return new InvoiceWithItemsResponseDto
        {
            RescueId    = rescueId,
            Invoice     = invoiceDetail,
            RepairItems = repairItems
        };
    }

    /// <summary>
    /// SA gửi hóa đơn cho Customer (UC-RES-04 D3).
    /// BR-17: chỉ SA. BR-18: INVOICED → INVOICE_SENT. BR-25: bảo mật qua HTTPS. SMC05.
    /// </summary>
    public async Task<SendInvoiceResultDto> SendInvoiceAsync(int rescueId, SendInvoiceDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForSendInvoice.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể gửi hóa đơn. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: INVOICED.");

        // Validate SA (BR-17)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền gửi hóa đơn.");

        var sentAt = DateTime.UtcNow;
        rescue.Status = RescueStatus.InvoiceSent;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new SendInvoiceResultDto
        {
            RescueId      = rescueId,
            Status        = RescueStatus.InvoiceSent,
            InvoiceStatus = InvoiceStatus.Sent,
            SentAt        = sentAt
        };
    }

    /// <summary>
    /// Customer chấp nhận hóa đơn (UC-RES-04 D4).
    /// Validate ownership + BR-18 (INVOICE_SENT → PAYMENT_PENDING).
    /// AF-01: không chấp nhận → gọi dispute endpoint (UC-RES-05).
    /// </summary>
    public async Task<AcceptInvoiceResultDto> AcceptInvoiceAsync(int rescueId, AcceptInvoiceDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForAcceptInvoice.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể chấp nhận hóa đơn. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: INVOICE_SENT.");

        // Validate đúng khách hàng sở hữu rescue (BR-03)
        if (rescue.CustomerID != request.CustomerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        // Lấy finalAmount để trả về trong response
        var finalAmount = 0m;
        if (rescue.ResultingMaintenanceID.HasValue)
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct);
            finalAmount = maintenance?.FinalAmount ?? rescue.ServiceFee;
        }

        rescue.Status = RescueStatus.PaymentPending;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new AcceptInvoiceResultDto
        {
            RescueId      = rescueId,
            Status        = RescueStatus.PaymentPending,
            InvoiceStatus = InvoiceStatus.Accepted,
            FinalAmount   = finalAmount
        };
    }

    /// <summary>
    /// Customer thanh toán (UC-RES-04 D5).
    /// BR-23: tạo PaymentTransaction. BR-18: PAYMENT_PENDING → COMPLETED.
    /// Validate: amount khớp finalAmount (BR-23), paymentMethod hợp lệ (SMP07).
    /// CarMaintenance.Status → COMPLETED (BR-22). SMP03, SMP05, BR-26.
    /// </summary>
    public async Task<PaymentResultDto> ProcessPaymentAsync(int rescueId, ProcessPaymentDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForProcessPayment.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể thanh toán. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PAYMENT_PENDING.");

        // Validate đúng khách hàng (BR-03)
        if (rescue.CustomerID != request.CustomerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        // Validate phương thức thanh toán (SMP07)
        var method = request.PaymentMethod.ToUpperInvariant();
        if (!PaymentMethod.ValidMethods.Contains(method))
            throw new InvalidOperationException(
                $"Phương thức thanh toán '{method}' không được hỗ trợ. Hợp lệ: CASH, CARD, TRANSFER, EWALLET.");

        // Lấy Repair Order để kiểm tra finalAmount
        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException("Rescue không có Repair Order liên kết. Không thể xử lý thanh toán.");

        var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct)
            ?? throw new InvalidOperationException("Repair Order không tồn tại.");

        var finalAmount = maintenance.FinalAmount ?? rescue.ServiceFee;

        // BR-23: Validate số tiền phải khớp finalAmount
        if (Math.Round(request.Amount, 2) != Math.Round(finalAmount, 2))
            throw new ArgumentException(
                $"Số tiền thanh toán không khớp với hóa đơn. Phải là {finalAmount:N0}đ.");

        var now = DateTime.UtcNow;

        // Tạo giao dịch thanh toán (BR-23, SMP05)
        var transaction = new Domain.Entities.PaymentTransaction
        {
            MaintenanceID        = rescue.ResultingMaintenanceID.Value,
            PaymentMethod        = method,
            Amount               = request.Amount,
            PaymentDate          = now,
            Status               = PaymentStatus.Success,
            TransactionReference = request.TransactionReference?.Trim(),
            ProcessedBy          = request.CustomerId
        };
        var created = await _rescueRepo.CreatePaymentTransactionAsync(transaction, ct);

        // Đóng Repair Order (BR-22: hóa đơn được thanh toán → đóng RO)
        maintenance.Status       = CarMaintenanceStatus.Completed;
        maintenance.CompletedDate = now;
        await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);

        // Cập nhật rescue → COMPLETED (BR-18, SMC05)
        rescue.Status        = RescueStatus.Completed;
        rescue.CompletedDate = now;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new PaymentResultDto
        {
            RescueId      = rescueId,
            Status        = RescueStatus.Completed,
            CompletedDate = now,
            Payment       = new PaymentInfoDto
            {
                TransactionId        = created.TransactionID,
                PaymentMethod        = created.PaymentMethod,
                Amount               = created.Amount,
                TransactionReference = created.TransactionReference,
                PaymentStatus        = created.Status,
                PaymentDate          = created.PaymentDate
            }
        };
    }

    // -------------------------------------------------------------------------
    // Private mapping methods — nhất quán với pattern UserService.MapToDetail()
    // -------------------------------------------------------------------------

    // =========================================================================
    // UC-RES-05: Tranh chấp hóa đơn
    // =========================================================================

    /// <summary>
    /// Customer tạo khiếu nại hóa đơn (UC-RES-05 E1).
    /// BR-18: INVOICE_SENT. BR-03: validate customer ownership. BR-26: audit. SMC12.
    /// Reason được append vào CarMaintenance.Notes với prefix [DISPUTE].
    /// Status: INVOICE_SENT → INVOICE_DISPUTED.
    /// Lưu ý: DisputeId dùng MaintenanceID làm định danh (không có entity Dispute riêng).
    /// </summary>
    public async Task<DisputeCreatedResultDto> CreateDisputeAsync(int rescueId, CreateDisputeDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForDispute.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Chỉ có thể khiếu nại khi hóa đơn ở trạng thái INVOICE_SENT. Trạng thái hiện tại: {rescue.Status}.");

        // Validate đúng khách hàng sở hữu rescue (BR-03)
        if (rescue.CustomerID != request.CustomerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        var now = DateTime.UtcNow;

        // Ghi lý do khiếu nại vào Notes của Repair Order (BR-26 — audit trail)
        if (rescue.ResultingMaintenanceID.HasValue)
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct);
            if (maintenance != null)
            {
                var existingNotes = string.IsNullOrWhiteSpace(maintenance.Notes) ? "" : maintenance.Notes + "\n";
                maintenance.Notes = existingNotes + $"[DISPUTE {now:yyyy-MM-dd HH:mm}] {request.Reason.Trim()}";
                await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
            }
        }

        // Chuyển trạng thái rescue → INVOICE_DISPUTED (SMC12)
        rescue.Status = RescueStatus.InvoiceDisputed;
        await _rescueRepo.UpdateAsync(rescue, ct);

        // DisputeId = MaintenanceID nếu có, fallback về RescueID
        var disputeId = rescue.ResultingMaintenanceID ?? rescueId;

        return new DisputeCreatedResultDto
        {
            RescueId = rescueId,
            Status   = RescueStatus.InvoiceDisputed,
            Dispute  = new DisputeInfoDto
            {
                DisputeId  = disputeId,
                Reason     = request.Reason.Trim(),
                CreatedAt  = now,
                ResolvedAt = null  // Chưa xử lý
            }
        };
    }

    /// <summary>
    /// SA xử lý tranh chấp và gửi lại hóa đơn (UC-RES-05 E2).
    /// BR-17: chỉ SA. BR-18: INVOICE_DISPUTED. BR-26: audit.
    /// reissue=true: tính lại hóa đơn với giá điều chỉnh, giữ nguyên member discount (BR-24).
    /// reissue=false: giữ nguyên hóa đơn cũ, chỉ ghi resolution notes và gửi lại.
    /// Status: INVOICE_DISPUTED → INVOICE_SENT.
    /// </summary>
    public async Task<ResolveDisputeResultDto> ResolveDisputeAsync(int rescueId, ResolveDisputeDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // Kiểm tra trạng thái hợp lệ (BR-18)
        if (!RescueStatus.AllowedForResolveDispute.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể xử lý tranh chấp. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: INVOICE_DISPUTED.");

        // Validate SA (BR-17)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền xử lý tranh chấp hóa đơn.");

        // Validate khi reissue=true phải có AdjustedServiceFee
        if (request.Reissue && !request.AdjustedServiceFee.HasValue)
            throw new ArgumentException("AdjustedServiceFee là bắt buộc khi Reissue=true.");

        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException("Rescue không có Repair Order liên kết. Không thể xử lý tranh chấp.");

        var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct)
            ?? throw new InvalidOperationException("Repair Order không tồn tại.");

        var now = DateTime.UtcNow;

        if (request.Reissue)
        {
            // Tính lại hóa đơn với giá điều chỉnh — giữ nguyên member discount % từ rank (BR-24)
            var adjustedFee      = request.AdjustedServiceFee!.Value;
            var adjustedDiscount = request.AdjustedManualDiscount;

            if (adjustedDiscount > adjustedFee)
                throw new ArgumentException("Giảm giá thủ công không được vượt quá phí dịch vụ điều chỉnh.");

            // Lấy lại member discount % từ rank tại thời điểm dịch vụ (đã lưu trong maintenance)
            var memberPercent = maintenance.MemberDiscountPercent;
            var memberAmount  = Math.Round(adjustedFee * memberPercent / 100m, 2);
            var finalAmount   = adjustedFee - adjustedDiscount - memberAmount;

            maintenance.TotalAmount           = adjustedFee;
            maintenance.DiscountAmount        = adjustedDiscount;
            maintenance.MemberDiscountAmount  = memberAmount;
            maintenance.FinalAmount           = finalAmount;
        }

        // Ghi resolution notes vào audit trail của Repair Order (BR-26)
        var existingNotes = string.IsNullOrWhiteSpace(maintenance.Notes) ? "" : maintenance.Notes + "\n";
        maintenance.Notes = existingNotes + $"[RESOLUTION {now:yyyy-MM-dd HH:mm}] {request.ResolutionNotes.Trim()}";
        await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);

        // Cập nhật rescue → INVOICE_SENT (Customer cần chấp nhận lại)
        rescue.Status = RescueStatus.InvoiceSent;
        await _rescueRepo.UpdateAsync(rescue, ct);

        // Map sang response DTO kế thừa InvoiceDetailDto (tái sử dụng logic map)
        var invoiceBase = MapToInvoiceDetail(maintenance, RescueStatus.InvoiceSent, maintenance.CreatedDate);

        return new ResolveDisputeResultDto
        {
            RescueId = rescueId,
            Status   = RescueStatus.InvoiceSent,
            Invoice  = new ResolvedInvoiceDto
            {
                // Kế thừa toàn bộ fields từ InvoiceDetailDto (sao chép thủ công vì struct copy)
                BaseAmount            = invoiceBase.BaseAmount,
                ManualDiscountAmount  = invoiceBase.ManualDiscountAmount,
                MembershipRankApplied = invoiceBase.MembershipRankApplied,
                MemberDiscountPercent = invoiceBase.MemberDiscountPercent,
                MemberDiscountAmount  = invoiceBase.MemberDiscountAmount,
                FinalAmount           = invoiceBase.FinalAmount,
                Notes                 = invoiceBase.Notes,
                CreatedAt             = invoiceBase.CreatedAt,
                InvoiceStatus         = InvoiceStatus.Sent,
                SentAt                = now,
                // Trường riêng của UC-RES-05
                IsReissued      = request.Reissue,
                ResolutionNotes = request.ResolutionNotes.Trim()
            }
        };
    }

    // =========================================================================
    // UC-RES-06: Hủy / Spam
    // =========================================================================

    /// <summary>
    /// SA hủy yêu cầu cứu hộ (UC-RES-06 F1).
    /// BR-18: không hủy COMPLETED/CANCELLED. BR-03: chỉ SA. BR-26: audit.
    /// Side effects: release technician (nếu đang nhiệm vụ), cancel CarMaintenance (nếu có).
    /// Reason được ghi vào CarMaintenance.Notes với prefix [CANCEL].
    /// </summary>
    public async Task<CancelRescueResultDto> CancelAsync(int rescueId, CancelRescueDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // BR-18: Không thể hủy khi đã hoàn tất hoặc đã hủy rồi
        if (RescueStatus.NotCancellable.Contains(rescue.Status))
            throw new InvalidOperationException(
                rescue.Status == RescueStatus.Completed
                    ? "Không thể hủy yêu cầu đã hoàn thành thanh toán."
                    : "Yêu cầu cứu hộ này đã được hủy trước đó.");

        // Validate SA (BR-03 — chỉ SA được hủy)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền hủy yêu cầu cứu hộ.");

        var now = DateTime.UtcNow;

        // Release technician nếu đang trong nhiệm vụ này (BR-28)
        if (rescue.AssignedTechnicianID.HasValue)
            await _userRepo.SetOnRescueMissionAsync(rescue.AssignedTechnicianID.Value, false, ct);

        // Cancel Repair Order liên kết (nếu có), ghi audit reason (BR-26)
        if (rescue.ResultingMaintenanceID.HasValue)
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct);
            if (maintenance != null && maintenance.Status != CarMaintenanceStatus.Completed)
            {
                var existingNotes = string.IsNullOrWhiteSpace(maintenance.Notes) ? "" : maintenance.Notes + "\n";
                var reasonNote    = string.IsNullOrWhiteSpace(request.Reason)
                                        ? "[CANCEL] Yêu cầu cứu hộ bị hủy."
                                        : $"[CANCEL {now:yyyy-MM-dd HH:mm}] {request.Reason.Trim()}";

                maintenance.Status       = CarMaintenanceStatus.Cancelled;
                maintenance.Notes        = existingNotes + reasonNote;
                maintenance.CompletedDate = now;
                await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
            }
        }

        // Chuyển rescue → CANCELLED (SMC06)
        rescue.Status        = RescueStatus.Cancelled;
        rescue.CompletedDate = now;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new CancelRescueResultDto
        {
            RescueId    = rescueId,
            Status      = RescueStatus.Cancelled,
            CancelledAt = now,
            Reason      = request.Reason?.Trim()
        };
    }

    /// <summary>
    /// SA/System đánh dấu yêu cầu cứu hộ là Spam (UC-RES-06 F2, AF-01).
    /// BR-18: chỉ PENDING | REVIEWING. BR-03: chỉ SA. BR-26: audit.
    /// Flow: PENDING/REVIEWING → set SPAM (ghi log) → CANCELLED ngay lập tức (SMC14, SMC06).
    /// SpamReason ghi vào audit log.
    /// </summary>
    public async Task<MarkSpamResultDto> MarkSpamAsync(int rescueId, MarkSpamDto request, CancellationToken ct)
    {
        var rescue = await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        // BR-18: Chỉ cho phép Spam khi đang ở giai đoạn tiếp nhận
        if (!RescueStatus.AllowedForMarkSpam.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Chỉ có thể đánh dấu Spam khi yêu cầu ở trạng thái PENDING hoặc REVIEWING. Trạng thái hiện tại: {rescue.Status}.");

        // Validate SA (BR-03)
        var sa = await _userRepo.GetByIdAsync(request.ServiceAdvisorId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền đánh dấu Spam.");

        var now      = DateTime.UtcNow;
        var spamNote = string.IsNullOrWhiteSpace(request.SpamReason)
                           ? "[SPAM] Yêu cầu bị đánh dấu Spam."
                           : $"[SPAM {now:yyyy-MM-dd HH:mm}] {request.SpamReason.Trim()}";

        // Bước 1: set SPAM trước để ghi nhận trong audit trail (SMC14)
        // Bước 2: chuyển ngay sang CANCELLED — 2 bước được merge vào 1 UpdateAsync
        // (Rescue entity không có Notes field riêng, ghi vào CarMaintenance nếu có)
        rescue.Status        = RescueStatus.Cancelled;
        rescue.CompletedDate = now;
        await _rescueRepo.UpdateAsync(rescue, ct);

        // Ghi spam reason vào Repair Order nếu có (BR-26 audit — thực tế ít gặp ở PENDING/REVIEWING)
        if (rescue.ResultingMaintenanceID.HasValue)
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct);
            if (maintenance != null && maintenance.Status != CarMaintenanceStatus.Completed)
            {
                var existingNotes    = string.IsNullOrWhiteSpace(maintenance.Notes) ? "" : maintenance.Notes + "\n";
                maintenance.Status       = CarMaintenanceStatus.Cancelled;
                maintenance.Notes        = existingNotes + spamNote;
                maintenance.CompletedDate = now;
                await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
            }
        }

        return new MarkSpamResultDto
        {
            RescueId     = rescueId,
            Status       = RescueStatus.Cancelled,
            MarkedAsSpam = true,
            SpamReason   = request.SpamReason?.Trim(),
            MarkedAt     = now
        };
    }

    /// <summary>
    /// Map CarMaintenance sang InvoiceDetailDto.
    /// InvoiceStatus được derive từ rescueStatus (entity không có field riêng).
    /// </summary>
    private static InvoiceDetailDto MapToInvoiceDetail(
        Domain.Entities.CarMaintenance m, string rescueStatus, DateTime createdAt) => new()
    {
        BaseAmount           = m.TotalAmount,
        ManualDiscountAmount = m.DiscountAmount,
        MembershipRankApplied = m.RankAtTimeOfService,
        MemberDiscountPercent = m.MemberDiscountPercent,
        MemberDiscountAmount  = m.MemberDiscountAmount,
        FinalAmount           = m.FinalAmount ?? m.TotalAmount,
        Notes                 = m.Notes,
        CreatedAt             = createdAt,
        InvoiceStatus         = InvoiceStatus.FromRescueStatus(rescueStatus)
    };

    /// <summary>Map entity RescueRequest (đã load navigation props) sang DTO chi tiết</summary>
    private static RescueRequestDetailDto MapToDetail(RescueRequest r) => new()
    {
        RescueId                 = r.RescueID,
        Status                   = r.Status,
        RescueType               = r.RescueType,
        CurrentAddress           = r.CurrentAddress,
        Latitude                 = r.Latitude,
        Longitude                = r.Longitude,
        ProblemDescription       = r.ProblemDescription,
        ImageEvidence            = r.ImageEvidence,
        ServiceFee               = r.ServiceFee,
        EstimatedArrivalDateTime = r.EstimatedArrivalDateTime,
        CreatedDate              = r.CreatedDate,
        CompletedDate            = r.CompletedDate,

        // Thông tin khách hàng
        CustomerId     = r.CustomerID,
        CustomerName   = r.Customer.FullName,
        CustomerPhone  = r.Customer.Phone,
        CustomerEmail  = r.Customer.Email,
        MembershipRank = r.Customer.CurrentRank?.RankName,

        // Thông tin xe
        CarId        = r.CarID,
        LicensePlate = r.Car.LicensePlate,
        Brand        = r.Car.Brand,
        Model        = r.Car.Model,
        Year         = r.Car.Year,
        Color        = r.Car.Color,

        // Thông tin SA
        ServiceAdvisorId   = r.ServiceAdvisorID,
        ServiceAdvisorName = r.ServiceAdvisor?.FullName,

        // Thông tin kỹ thuật viên
        AssignedTechnicianId    = r.AssignedTechnicianID,
        AssignedTechnicianName  = r.AssignedTechnician?.FullName,
        AssignedTechnicianPhone = r.AssignedTechnician?.Phone,

        ResultingMaintenanceId = r.ResultingMaintenanceID
    };
}
