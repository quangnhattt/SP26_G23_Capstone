using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Rescue;
using AGMS.Domain.Entities;
using System.Text.Json;

namespace AGMS.Infrastructure.Services;

public class RescueRequestService : IRescueRequestService
{
    private readonly IRescueRequestRepository _rescueRepo;
    private readonly IUserRepository _userRepo;

    public RescueRequestService(
        IRescueRequestRepository rescueRepo,
        IUserRepository userRepo
    )
    {
        _rescueRepo = rescueRepo;
        _userRepo = userRepo;
    }

    // =========================================================================
    // UC-RES-01: Tiếp nhận & Đánh giá
    // =========================================================================

    /// <summary>
    /// Khách hàng tạo yêu cầu cứu hộ (UC-RES-01 Step 1-2).
    /// customerId từ token. Validate: BR-16, xe tồn tại, xe thuộc sở hữu.
    /// </summary>
    public async Task<RescueRequestDetailDto> CreateAsync(
        int customerId,
        CreateRescueRequestDto request,
        CancellationToken ct
    )
    {
        var car =
            await _rescueRepo.GetCarByIdAsync(request.CarId, ct)
            ?? throw new KeyNotFoundException("Xe không tồn tại.");

        var customer =
            await _userRepo.GetByIdAsync(customerId, ct)
            ?? throw new KeyNotFoundException("Khách hàng không tồn tại.");

        if (customer.RoleID != UserRole.Customer)
            throw new ArgumentException("Người dùng không có quyền tạo yêu cầu cứu hộ.");

        if (car.OwnerID != customerId)
            throw new ArgumentException("Xe không thuộc sở hữu của khách hàng này.");

        // Khách có TrustScore = 0 phải đóng cọc, nhưng số tiền cụ thể sẽ do SA nhập ở bước propose.
        var requiresDeposit = customer.TrustScore <= 0;

        var rescue = new RescueRequest
        {
            CarID = request.CarId,
            CustomerID = customerId,
            CurrentAddress = request.CurrentAddress.Trim(),
            ProblemDescription = request.ProblemDescription.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            ImageEvidence = string.IsNullOrWhiteSpace(request.ImageEvidence)
                ? null
                : request.ImageEvidence.Trim(),
            Status = RescueStatus.Pending,
            ServiceFee = 0,
            RequiresDeposit = requiresDeposit,
            DepositAmount = 0m,
            IsDepositPaid = !requiresDeposit,
            IsDepositConfirmed = !requiresDeposit,
            CreatedDate = DateTime.UtcNow,
            Phone = request.Phone
        };

        await _rescueRepo.AddAsync(rescue, ct);

        var created =
            await _rescueRepo.GetByIdAsync(rescue.RescueID, ct)
            ?? throw new InvalidOperationException("Không thể tải yêu cầu cứu hộ vừa tạo.");
        return await MapToDetailAsync(created, ct);
    }

    /// <summary>Customer gửi thông tin/chứng từ đặt cọc để chờ SA xác nhận.</summary>
    public async Task<RescueDepositResultDto> PayDepositAsync(
        int rescueId,
        int customerId,
        PayRescueDepositDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (rescue.CustomerID != customerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        if (!rescue.RequiresDeposit)
            throw new InvalidOperationException("Yêu cầu này không yêu cầu đặt cọc.");

        if (rescue.IsDepositConfirmed)
            throw new InvalidOperationException("Yêu cầu này đã được SA xác nhận nhận cọc.");

        if (rescue.IsDepositPaid)
            throw new InvalidOperationException("Khách hàng đã gửi thông tin đặt cọc cho yêu cầu này.");

        if (rescue.Status == RescueStatus.Cancelled || rescue.Status == RescueStatus.Completed)
            throw new InvalidOperationException("Không thể đặt cọc cho yêu cầu đã kết thúc.");

        if (!RescueStatus.AllowedForDeposit.Contains(rescue.Status))
            throw new InvalidOperationException(
                "Chỉ có thể đóng cọc sau khi khách hàng đã đồng ý đề xuất."
            );

        var method = request.PaymentMethod.ToUpperInvariant();
        if (!PaymentMethod.ValidMethods.Contains(method))
            throw new InvalidOperationException(
                $"Phương thức thanh toán '{method}' không được hỗ trợ. Hợp lệ: CASH, CARD, TRANSFER, EWALLET."
            );

        if (Math.Round(request.Amount, 2) != Math.Round(rescue.DepositAmount, 2))
            throw new ArgumentException(
                $"Số tiền đặt cọc không khớp. Phải là {rescue.DepositAmount:N0}đ."
            );

        var now = DateTime.UtcNow;
        // Ghi nhận khách đã gửi chứng từ đặt cọc; bước mở khóa workflow sẽ do SA xác nhận riêng.
        rescue.IsDepositPaid = true;
        rescue.DepositPaidDate = now;
        rescue.IsDepositConfirmed = false;
        rescue.DepositConfirmedDate = null;
        rescue.DepositConfirmedByID = null;
        rescue.DepositPaymentMethod = method;
        rescue.DepositTransactionReference = request.TransactionReference?.Trim();
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new RescueDepositResultDto
        {
            RescueId = rescueId,
            Status = rescue.Status,
            DepositAmount = rescue.DepositAmount,
            IsDepositPaid = true,
            DepositPaidDate = now,
            IsDepositConfirmed = false,
            DepositConfirmedDate = null,
            DepositConfirmedById = null,
            PaymentMethod = method,
            TransactionReference = rescue.DepositTransactionReference
        };
    }

    /// <summary>SA xác nhận đã nhận cọc sau khi khách hàng gửi thông tin thanh toán.</summary>
    public async Task<RescueDepositResultDto> ConfirmDepositAsync(
        int rescueId,
        int saId,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!rescue.RequiresDeposit)
            throw new InvalidOperationException("Yêu cầu này không yêu cầu đặt cọc.");

        if (!rescue.IsDepositPaid)
            throw new InvalidOperationException("Khách hàng chưa gửi thông tin đặt cọc.");

        if (rescue.IsDepositConfirmed)
            throw new InvalidOperationException("Yêu cầu này đã được SA xác nhận nhận cọc.");

        if (rescue.Status == RescueStatus.Cancelled || rescue.Status == RescueStatus.Completed)
            throw new InvalidOperationException("Không thể xác nhận cọc cho yêu cầu đã kết thúc.");

        if (!RescueStatus.AllowedForDeposit.Contains(rescue.Status))
            throw new InvalidOperationException(
                "Chỉ có thể xác nhận cọc khi yêu cầu đang ở bước chờ xử lý sau khi khách hàng đồng ý đề xuất."
            );

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền xác nhận nhận cọc.");

        if (rescue.ServiceAdvisorID.HasValue && rescue.ServiceAdvisorID.Value != saId)
            throw new ArgumentException("Chỉ Service Advisor đang xử lý yêu cầu này mới được xác nhận nhận cọc.");

        var now = DateTime.UtcNow;
        rescue.ServiceAdvisorID ??= saId;
        rescue.IsDepositConfirmed = true;
        rescue.DepositConfirmedDate = now;
        rescue.DepositConfirmedByID = saId;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new RescueDepositResultDto
        {
            RescueId = rescue.RescueID,
            Status = rescue.Status,
            DepositAmount = rescue.DepositAmount,
            IsDepositPaid = rescue.IsDepositPaid,
            DepositPaidDate = rescue.DepositPaidDate,
            IsDepositConfirmed = true,
            DepositConfirmedDate = now,
            DepositConfirmedById = saId,
            PaymentMethod = rescue.DepositPaymentMethod ?? string.Empty,
            TransactionReference = rescue.DepositTransactionReference
        };
    }

    public async Task<IEnumerable<RescueRequestListItemDto>> GetListAsync(
        string? status,
        string? rescueType,
        int? customerId,
        DateTime? fromDate,
        DateTime? toDate,
        CancellationToken ct
    ) => await _rescueRepo.GetListAsync(status, rescueType, customerId, fromDate, toDate, ct);

    /// <summary>Xem chi tiết yêu cầu cứu hộ (UC-RES-01 Step 3-4).</summary>
    public async Task<RescueRequestDetailDto> GetDetailAsync(int rescueId, CancellationToken ct)
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");
        return await MapToDetailAsync(rescue, ct);
    }

    /// <summary>SA lấy danh sách kỹ thuật viên khả dụng (UC-RES-01 Step 4, BR-28).</summary>
    public async Task<IEnumerable<AvailableTechnicianDto>> GetAvailableTechniciansAsync(
        int rescueId,
        CancellationToken ct
    )
    {
        _ =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");
        return await _rescueRepo.GetAvailableTechniciansAsync(ct);
    }

    /// <summary>
    /// SA gửi đề xuất sửa tại chỗ hoặc kéo xe (UC-RES-01 Step 5-6).
    /// saId từ token. Validate: BR-17, BR-18.
    /// </summary>
    public async Task<RescueRequestDetailDto> ProposeAsync(
        int rescueId,
        int saId,
        ProposeRescueDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForPropose.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể gửi đề xuất. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PENDING hoặc REVIEWING."
            );

        // Kiểm tra quyền của Service Advisor (BR-17)

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền gửi đề xuất cứu hộ.");

        var newStatus =
            request.RescueType.ToUpperInvariant() == RescueType.Roadside
                ? RescueStatus.ProposedRoadside
                : RescueStatus.ProposedTowing;
        var suggestedParts = await BuildSuggestedPartSnapshotsAsync(request.SuggestedParts, ct);

        if (rescue.RequiresDeposit)
        {
            if (!request.DepositAmount.HasValue || request.DepositAmount.Value <= 0)
                throw new ArgumentException(
                    "Yêu cầu này bắt buộc đặt cọc, SA phải nhập số tiền đặt cọc lớn hơn 0 khi gửi đề xuất."
                );

            rescue.DepositAmount = decimal.Round(request.DepositAmount.Value, 2);
        }
        else
        {
            rescue.DepositAmount = 0m;
        }

        rescue.ServiceAdvisorID = saId;
        rescue.RescueType = request.RescueType.ToUpperInvariant();
        // Luu danh sach phụ tùng dự kiến ngay ở bước đề xuất để FE có thể hiển thị trước khi đi tới chẩn đoán/sửa chữa.
        rescue.SuggestedPartsJson = SerializeSuggestedParts(suggestedParts);
        rescue.ServiceFee = request.EstimatedServiceFee ?? rescue.ServiceFee;
        rescue.Status = newStatus;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    // =========================================================================
    // UC-RES-02: Điều phối & Sửa ven đường
    // =========================================================================

    /// <summary>
    /// SA assign kỹ thuật viên (UC-RES-02 Step 1-2).
    /// saId từ token. BR-17, BR-18 (PROPOSAL_ACCEPTED + ROADSIDE), BR-28. SMC03, SMC10.
    /// </summary>
    /// <summary>
    /// Khách hàng chấp nhận đề xuất của SA trước khi chuyển sang bước đặt cọc và điều phối.
    /// </summary>
    public async Task<RescueRequestDetailDto> AcceptProposalAsync(
        int rescueId,
        int customerId,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForAcceptProposal.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể chấp nhận đề xuất. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PROPOSED_ROADSIDE hoặc PROPOSED_TOWING."
            );

        if (rescue.CustomerID != customerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        rescue.Status = RescueStatus.ProposalAccepted;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    public async Task<RescueRequestDetailDto> AssignTechnicianAsync(
        int rescueId,
        int saId,
        AssignTechnicianDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForAssignTechnician.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể assign kỹ thuật viên. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PROPOSAL_ACCEPTED."
            );

        if (!string.Equals(rescue.RescueType, RescueType.Roadside, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                "Yêu cầu này chưa được khách hàng chấp nhận theo phương án sửa tại chỗ."
            );

        EnsureDepositPaid(rescue);

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException(
                "Chỉ Service Advisor mới có quyền điều phối kỹ thuật viên."
            );

        // Validate kỹ thuật viên tồn tại và đang rảnh (BR-28)
        var tech =
            await _userRepo.GetByIdAsync(request.TechnicianId, ct)
            ?? throw new KeyNotFoundException("Kỹ thuật viên không tồn tại.");
        if (tech.RoleID != UserRole.Technician)
            throw new ArgumentException("Người dùng không phải kỹ thuật viên.");
        if (!tech.IsActive)
            throw new InvalidOperationException("Kỹ thuật viên không còn hoạt động.");
        if (tech.IsOnRescueMission)
            throw new ArgumentException("Kỹ thuật viên đang trong một nhiệm vụ cứu hộ khác.");

        rescue.AssignedTechnicianID = request.TechnicianId;
        rescue.EstimatedArrivalDateTime = request.EstimatedArrivalDateTime;
        rescue.Status = RescueStatus.Dispatched;
        await _rescueRepo.UpdateAsync(rescue, ct);

        // Đặt trước kỹ thuật viên (SMC10)
        await _userRepo.SetOnRescueMissionAsync(request.TechnicianId, true, ct);

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    /// <summary>
    /// Technician nhận job (UC-RES-02 Step 3). techId từ token. DISPATCHED → EN_ROUTE. SMC05.
    /// </summary>
    public async Task<RescueRequestDetailDto> AcceptJobAsync(
        int rescueId,
        int techId,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForAcceptJob.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể nhận job. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: DISPATCHED."
            );

        if (rescue.AssignedTechnicianID != techId)
            throw new ArgumentException(
                "Bạn không phải kỹ thuật viên được phân công cho yêu cầu này."
            );

        rescue.Status = RescueStatus.EnRoute;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    /// <summary>
    /// Technician báo đến hiện trường (UC-RES-02 Step 4). techId từ token. EN_ROUTE → ON_SITE. SMC05.
    /// </summary>
    public async Task<RescueRequestDetailDto> ArriveAsync(
        int rescueId,
        int techId,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForArrive.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể cập nhật trạng thái đến nơi. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: EN_ROUTE."
            );

        if (rescue.AssignedTechnicianID != techId)
            throw new ArgumentException(
                "Bạn không phải kỹ thuật viên được phân công cho yêu cầu này."
            );

        rescue.Status = RescueStatus.OnSite;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    /// <summary>
    /// Ghi nhận chấp thuận/từ chối sửa tại chỗ (UC-RES-02 Step 5, BR-RES-01).
    /// actorId từ token. consentGiven=false → PROPOSED_TOWING, release technician (AF-02).
    /// </summary>
    public async Task<RescueRequestDetailDto> RecordConsentAsync(
        int rescueId,
        int actorId,
        CustomerConsentDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForConsent.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể ghi nhận chấp thuận. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: ON_SITE."
            );

        if (!request.ConsentGiven)
        {
            // AF-02: Customer từ chối → chuyển sang kéo xe, release technician
            rescue.Status = RescueStatus.ProposedTowing;
            await _rescueRepo.UpdateAsync(rescue, ct);

            if (rescue.AssignedTechnicianID.HasValue)
                await _userRepo.SetOnRescueMissionAsync(
                    rescue.AssignedTechnicianID.Value,
                    false,
                    ct
                );
        }

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    /// <summary>
    /// Technician bắt đầu chẩn đoán (UC-RES-02 Step 6). techId từ token.
    /// canRepairOnSite=true → tạo Repair Order (BR-07, BR-11), DIAGNOSING.
    /// canRepairOnSite=false → AF-01: PROPOSED_TOWING, release technician.
    /// </summary>
    public async Task<RescueRequestDetailDto> StartDiagnosisAsync(
        int rescueId,
        int techId,
        StartDiagnosisDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForDiagnosis.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể bắt đầu chẩn đoán. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: ON_SITE."
            );

        if (rescue.AssignedTechnicianID != techId)
            throw new ArgumentException(
                "Bạn không phải kỹ thuật viên được phân công cho yêu cầu này."
            );

        if (!request.CanRepairOnSite)
        {
            // AF-01: Không thể sửa tại chỗ → kéo xe, release technician
            rescue.Status = RescueStatus.ProposedTowing;
            await _rescueRepo.UpdateAsync(rescue, ct);

            if (rescue.AssignedTechnicianID.HasValue)
                await _userRepo.SetOnRescueMissionAsync(
                    rescue.AssignedTechnicianID.Value,
                    false,
                    ct
                );

            var notFixed =
                await _rescueRepo.GetByIdAsync(rescueId, ct)
                ?? throw new InvalidOperationException(
                    "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
                );
            return await MapToDetailAsync(notFixed, ct);
        }

        // Kiểm tra xe chưa có Repair Order active (BR-11)
        if (await _rescueRepo.HasActiveMaintenanceForCarAsync(rescue.CarID, ct))
            throw new InvalidOperationException(
                "Xe đã có Repair Order đang xử lý. Không thể tạo thêm. (BR-11)"
            );

        // Tạo Repair Order mới cho sửa ven đường (BR-07)
        var maintenance = new CarMaintenance
        {
            CarID = rescue.CarID,
            MaintenanceType = RescueMaintenanceType.Roadside,
            Status = CarMaintenanceStatus.Waiting,
            Notes = request.DiagnosisNotes.Trim(),
            CreatedBy = techId,
            AssignedTechnicianID = techId,
            TotalAmount = 0,
            DiscountAmount = 0,
            MemberDiscountAmount = 0,
            MemberDiscountPercent = 0,
            MaintenanceDate = DateTime.UtcNow,
            CreatedDate = DateTime.UtcNow
        };
        var created = await _rescueRepo.CreateMaintenanceAsync(maintenance, ct);

        rescue.ResultingMaintenanceID = created.MaintenanceID;
        rescue.Status = RescueStatus.Diagnosing;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    /// <summary>
    /// Ghi nhận vật tư/dịch vụ sử dụng (UC-RES-02 Step 7, BR-20, SMC08).
    /// Lần đầu DIAGNOSING → REPAIRING. Trả về toàn bộ items + subtotal.
    /// </summary>
    public async Task<RepairItemsResultDto> AddRepairItemsAsync(
        int rescueId,
        AddRepairItemsDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForRepairItems.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể ghi vật tư. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: DIAGNOSING hoặc REPAIRING."
            );

        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException(
                "Chưa có Repair Order. Vui lòng hoàn tất bước chẩn đoán trước."
            );

        var maintenanceId = rescue.ResultingMaintenanceID.Value;

        // Validate và thêm từng vật tư (BR-20)
        foreach (var item in request.Items)
        {
            _ =
                await _rescueRepo.GetProductByIdAsync(item.ProductId, ct)
                ?? throw new KeyNotFoundException(
                    $"Sản phẩm ID={item.ProductId} không tồn tại hoặc không còn hoạt động."
                );

            var serviceDetail = new ServiceDetail
            {
                MaintenanceID = maintenanceId,
                ProductID = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                ItemStatus = "APPROVED",
                IsAdditional = false,
                FromPackage = false,
                Notes = item.Notes?.Trim()
            };
            await _rescueRepo.AddServiceDetailAsync(serviceDetail, ct);
        }

        // Lần đầu gọi (DIAGNOSING): chuyển sang REPAIRING
        if (rescue.Status == RescueStatus.Diagnosing)
        {
            rescue.Status = RescueStatus.Repairing;
            await _rescueRepo.UpdateAsync(rescue, ct);
        }

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
            RescueId = rescueId,
            Status =
                rescue.Status == RescueStatus.Diagnosing ? RescueStatus.Repairing : rescue.Status,
            MaintenanceId = maintenanceId,
            RepairItems = allItems,
            Subtotal = subtotal
        };
    }

    /// <summary>
    /// Technician hoàn thành sửa chữa (UC-RES-02 Step 8). techId từ token.
    /// REPAIRING → REPAIR_COMPLETE. Release technician. SMC05.
    /// </summary>
    public async Task<RescueRequestDetailDto> CompleteRepairAsync(
        int rescueId,
        int techId,
        CompleteRepairDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForCompleteRepair.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể hoàn thành sửa chữa. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: REPAIRING."
            );

        if (rescue.AssignedTechnicianID != techId)
            throw new ArgumentException(
                "Bạn không phải kỹ thuật viên được phân công cho yêu cầu này."
            );

        // Lưu ghi chú hoàn thành vào Repair Order
        if (
            rescue.ResultingMaintenanceID.HasValue
            && !string.IsNullOrWhiteSpace(request.CompletionNotes)
        )
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(
                rescue.ResultingMaintenanceID.Value,
                ct
            );
            if (maintenance != null)
            {
                var existing = string.IsNullOrWhiteSpace(maintenance.Notes)
                    ? ""
                    : maintenance.Notes + "\n";
                maintenance.Notes = existing + $"[Hoàn thành] {request.CompletionNotes.Trim()}";
                await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
            }
        }

        rescue.Status = RescueStatus.RepairComplete;
        await _rescueRepo.UpdateAsync(rescue, ct);
        await _userRepo.SetOnRescueMissionAsync(techId, false, ct);

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    // =========================================================================
    // UC-RES-03: Dịch vụ kéo xe
    // =========================================================================

    /// <summary>
    /// SA điều phối kéo xe (UC-RES-03 C1). saId từ token.
    /// PROPOSAL_ACCEPTED + TOWING → TOWING_DISPATCHED. SMC05, SMC11.
    /// </summary>
    public async Task<TowingDispatchResultDto> DispatchTowingAsync(
        int rescueId,
        int saId,
        DispatchTowingDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForDispatchTowing.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể điều phối kéo xe. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PROPOSAL_ACCEPTED."
            );

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException(
                "Chỉ Service Advisor mới có quyền điều phối dịch vụ kéo xe."
            );

        if (!string.Equals(rescue.RescueType, RescueType.Towing, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                "Yêu cầu này chưa được khách hàng chấp nhận theo phương án kéo xe."
            );

        EnsureDepositPaid(rescue);

        rescue.RescueType = RescueType.Towing;
        rescue.Status = RescueStatus.TowingDispatched;
        rescue.ServiceFee = request.TowingServiceFee ?? rescue.ServiceFee;
        rescue.EstimatedArrivalDateTime = request.EstimatedArrival;
        await _rescueRepo.UpdateAsync(rescue, ct);

        // TowingNotes không persist vào entity — echo lại trong response
        return new TowingDispatchResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.TowingDispatched,
            RescueType = RescueType.Towing,
            TowingNotes = request.TowingNotes,
            EstimatedArrival = request.EstimatedArrival,
            TowingServiceFee = request.TowingServiceFee
        };
    }

    /// <summary>
    /// Customer chấp nhận kéo xe (UC-RES-03 C2). customerId từ token.
    /// TOWING_DISPATCHED → TOWING_ACCEPTED.
    /// </summary>
    public async Task<RescueRequestDetailDto> AcceptTowingAsync(
        int rescueId,
        int customerId,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForAcceptTowing.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể chấp nhận kéo xe. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: TOWING_DISPATCHED."
            );

        if (rescue.CustomerID != customerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        rescue.Status = RescueStatus.TowingAccepted;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var updated =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new InvalidOperationException(
                "Không thể tải yêu cầu cứu hộ sau khi cập nhật."
            );
        return await MapToDetailAsync(updated, ct);
    }

    /// <summary>
    /// SA hoàn tất kéo xe — tạo Repair Order (UC-RES-03 C3). saId từ token.
    /// TOWING_ACCEPTED → TOWED. BR-19. SMC07.
    /// </summary>
    public async Task<CompleteTowingResultDto> CompleteTowingAsync(
        int rescueId,
        int saId,
        CompleteTowingDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForCompleteTowing.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể hoàn tất kéo xe. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: TOWING_ACCEPTED."
            );

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException(
                "Chỉ Service Advisor mới có quyền hoàn tất dịch vụ kéo xe."
            );

        if (await _rescueRepo.HasActiveMaintenanceForCarAsync(rescue.CarID, ct))
            throw new InvalidOperationException(
                "Xe đã có Repair Order đang xử lý. Không thể tạo thêm. (BR-11)"
            );

        var now = DateTime.UtcNow;
        var maintenance = new CarMaintenance
        {
            CarID = rescue.CarID,
            MaintenanceType = RescueMaintenanceType.Towing,
            Status = CarMaintenanceStatus.Waiting,
            Notes = string.IsNullOrWhiteSpace(request.RepairOrderNotes)
                ? null
                : request.RepairOrderNotes.Trim(),
            CreatedBy = saId,
            TotalAmount = 0,
            DiscountAmount = 0,
            MemberDiscountAmount = 0,
            MemberDiscountPercent = 0,
            MaintenanceDate = now,
            CreatedDate = now
        };
        var created = await _rescueRepo.CreateMaintenanceAsync(maintenance, ct);

        rescue.ResultingMaintenanceID = created.MaintenanceID;
        rescue.Status = RescueStatus.Towed;
        rescue.CompletedDate = now;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new CompleteTowingResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.Towed,
            ResultingMaintenance = new TowingMaintenanceDto
            {
                MaintenanceId = created.MaintenanceID,
                MaintenanceType = created.MaintenanceType,
                Status = created.Status,
                CreatedDate = created.CreatedDate
            }
        };
    }

    // =========================================================================
    // UC-RES-04: Hóa đơn & Thanh toán
    // =========================================================================

    /// <summary>
    /// SA tạo hóa đơn (UC-RES-04 D1). saId từ token.
    /// BR-24: tính member discount tự động. SMP02, SMP06.
    /// </summary>
    public async Task<CreateInvoiceResultDto> CreateInvoiceAsync(
        int rescueId,
        int saId,
        CreateInvoiceDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForCreateInvoice.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể tạo hóa đơn. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: REPAIR_COMPLETE hoặc TOWED."
            );

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền tạo hóa đơn cứu hộ.");

        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException(
                "Chưa có Repair Order liên kết. Không thể tạo hóa đơn."
            );

        if (request.ManualDiscount > request.RescueServiceFee)
            throw new ArgumentException("Giảm giá thủ công không được vượt quá tổng phí dịch vụ.");

        // BR-24: tính member discount từ hạng thành viên của khách
        var rank = rescue.Customer?.CurrentRank;
        var memberPercent = rank?.DiscountPercent ?? 0m;
        var memberAmount = Math.Round(request.RescueServiceFee * memberPercent / 100m, 2);
        var finalAmount = request.RescueServiceFee - request.ManualDiscount - memberAmount;
        var now = DateTime.UtcNow;

        var maintenance =
            await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct)
            ?? throw new InvalidOperationException("Repair Order không tồn tại.");

        maintenance.TotalAmount = request.RescueServiceFee;
        maintenance.DiscountAmount = request.ManualDiscount;
        maintenance.MemberDiscountPercent = memberPercent;
        maintenance.MemberDiscountAmount = memberAmount;
        maintenance.FinalAmount = finalAmount;
        maintenance.RankAtTimeOfService = rank?.RankName;
        maintenance.Notes = string.IsNullOrWhiteSpace(request.Notes)
            ? maintenance.Notes
            : request.Notes.Trim();
        await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);

        rescue.ServiceFee = request.RescueServiceFee;
        rescue.Status = RescueStatus.Invoiced;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new CreateInvoiceResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.Invoiced,
            Invoice = MapToInvoiceDetail(maintenance, rescue, RescueStatus.Invoiced, now)
        };
    }

    /// <summary>Lấy thông tin hóa đơn và danh sách vật tư/dịch vụ (UC-RES-04 D2).</summary>
    public async Task<InvoiceWithItemsResponseDto> GetInvoiceAsync(
        int rescueId,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException(
                "Rescue chưa có Repair Order. Hóa đơn chưa được tạo."
            );

        var maintenance =
            await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct)
            ?? throw new InvalidOperationException("Repair Order không tồn tại.");

        var repairItems = await _rescueRepo.GetRepairItemsAsync(
            rescue.ResultingMaintenanceID.Value,
            ct
        );

        return new InvoiceWithItemsResponseDto
        {
            RescueId = rescueId,
            Invoice = MapToInvoiceDetail(
                maintenance,
                rescue,
                rescue.Status,
                maintenance.CreatedDate
            ),
            RepairItems = repairItems
        };
    }

    /// <summary>
    /// SA gửi hóa đơn cho Customer (UC-RES-04 D3). saId từ token.
    /// INVOICED → INVOICE_SENT. BR-25. SMC05.
    /// </summary>
    public async Task<SendInvoiceResultDto> SendInvoiceAsync(
        int rescueId,
        int saId,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForSendInvoice.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể gửi hóa đơn. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: INVOICED."
            );

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền gửi hóa đơn.");

        var sentAt = DateTime.UtcNow;
        rescue.Status = RescueStatus.InvoiceSent;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new SendInvoiceResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.InvoiceSent,
            InvoiceStatus = InvoiceStatus.Sent,
            SentAt = sentAt
        };
    }

    /// <summary>
    /// Customer chấp nhận hóa đơn (UC-RES-04 D4). customerId từ token.
    /// INVOICE_SENT → PAYMENT_PENDING.
    /// </summary>
    public async Task<AcceptInvoiceResultDto> AcceptInvoiceAsync(
        int rescueId,
        int customerId,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForAcceptInvoice.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể chấp nhận hóa đơn. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: INVOICE_SENT."
            );

        if (rescue.CustomerID != customerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        var finalAmount = 0m;
        var depositApplied = 0m;
        if (rescue.ResultingMaintenanceID.HasValue)
        {
            var mnt = await _rescueRepo.GetMaintenanceByIdAsync(
                rescue.ResultingMaintenanceID.Value,
                ct
            );
            // Khách xác nhận phần tiền còn lại sau khi đã trừ tiền cọc đã thanh toán.
            var invoiceFinalAmount = mnt?.FinalAmount ?? rescue.ServiceFee;
            depositApplied = GetDepositAppliedAmount(rescue, invoiceFinalAmount);
            finalAmount = GetOutstandingAmount(rescue, invoiceFinalAmount);
        }

        rescue.Status = RescueStatus.PaymentPending;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new AcceptInvoiceResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.PaymentPending,
            InvoiceStatus = InvoiceStatus.Accepted,
            FinalAmount = finalAmount,
            DepositAppliedAmount = depositApplied
        };
    }

    /// <summary>
    /// Customer thanh toán (UC-RES-04 D5). customerId từ token.
    /// PAYMENT_PENDING → COMPLETED. BR-23. SMP03, SMP05.
    /// </summary>
    public async Task<PaymentResultDto> ProcessPaymentAsync(
        int rescueId,
        int customerId,
        ProcessPaymentDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForProcessPayment.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể thanh toán. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: PAYMENT_PENDING."
            );

        if (rescue.CustomerID != customerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        // Validate phương thức thanh toán (SMP07)
        var method = request.PaymentMethod.ToUpperInvariant();
        if (!PaymentMethod.ValidMethods.Contains(method))
            throw new InvalidOperationException(
                $"Phương thức thanh toán '{method}' không được hỗ trợ. Hợp lệ: CASH, CARD, TRANSFER, EWALLET."
            );

        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException(
                "Rescue không có Repair Order. Không thể xử lý thanh toán."
            );

        var maintenance =
            await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct)
            ?? throw new InvalidOperationException("Repair Order không tồn tại.");

        // Thanh toán cuối chỉ thu phần còn lại vì tiền cọc được xem như khoản trả trước.
        var invoiceFinalAmount = maintenance.FinalAmount ?? rescue.ServiceFee;
        var depositApplied = GetDepositAppliedAmount(rescue, invoiceFinalAmount);
        var finalAmount = GetOutstandingAmount(rescue, invoiceFinalAmount);

        // BR-23: Validate số tiền phải khớp finalAmount
        if (Math.Round(request.Amount, 2) != Math.Round(finalAmount, 2))
            throw new ArgumentException(
                $"Số tiền thanh toán không khớp với hóa đơn. Phải là {finalAmount:N0}đ."
            );

        var now = DateTime.UtcNow;

        // Tạo giao dịch thanh toán (BR-23, SMP05)
        var transaction = new PaymentTransaction
        {
            MaintenanceID = rescue.ResultingMaintenanceID.Value,
            PaymentMethod = method,
            Amount = request.Amount,
            PaymentDate = now,
            Status = PaymentStatus.Success,
            TransactionReference = request.TransactionReference?.Trim(),
            ProcessedBy = customerId
        };
        var created = await _rescueRepo.CreatePaymentTransactionAsync(transaction, ct);

        // Đóng Repair Order (BR-22)
        maintenance.Status = CarMaintenanceStatus.Completed;
        maintenance.CompletedDate = now;
        await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);

        rescue.Status = RescueStatus.Completed;
        rescue.CompletedDate = now;
        await _rescueRepo.UpdateAsync(rescue, ct);
        // Chỉ tăng điểm tin cậy khi ca cứu hộ đã hoàn tất và thanh toán thành công.
        await _userRepo.IncrementTrustScoreAsync(customerId, ct);

        return new PaymentResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.Completed,
            CompletedDate = now,
            DepositAppliedAmount = depositApplied,
            Payment = new PaymentInfoDto
            {
                TransactionId = created.TransactionID,
                PaymentMethod = created.PaymentMethod,
                Amount = created.Amount,
                TransactionReference = created.TransactionReference,
                PaymentStatus = created.Status,
                PaymentDate = created.PaymentDate
            }
        };
    }

    // =========================================================================
    // UC-RES-05: Tranh chấp hóa đơn
    // =========================================================================

    /// <summary>
    /// Customer tạo khiếu nại hóa đơn (UC-RES-05 E1). customerId từ token.
    /// INVOICE_SENT → INVOICE_DISPUTED. BR-26. SMC12.
    /// </summary>
    public async Task<DisputeCreatedResultDto> CreateDisputeAsync(
        int rescueId,
        int customerId,
        CreateDisputeDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForDispute.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Chỉ có thể khiếu nại khi hóa đơn ở trạng thái INVOICE_SENT. Trạng thái hiện tại: {rescue.Status}."
            );

        if (rescue.CustomerID != customerId)
            throw new ArgumentException("Bạn không phải khách hàng của yêu cầu cứu hộ này.");

        var now = DateTime.UtcNow;

        // Ghi lý do khiếu nại vào Notes của Repair Order (BR-26)
        if (rescue.ResultingMaintenanceID.HasValue)
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(
                rescue.ResultingMaintenanceID.Value,
                ct
            );
            if (maintenance != null)
            {
                var existing = string.IsNullOrWhiteSpace(maintenance.Notes)
                    ? ""
                    : maintenance.Notes + "\n";
                maintenance.Notes =
                    existing + $"[DISPUTE {now:yyyy-MM-dd HH:mm}] {request.Reason.Trim()}";
                await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
            }
        }

        rescue.Status = RescueStatus.InvoiceDisputed;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new DisputeCreatedResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.InvoiceDisputed,
            Dispute = new DisputeInfoDto
            {
                DisputeId = rescue.ResultingMaintenanceID ?? rescueId,
                Reason = request.Reason.Trim(),
                CreatedAt = now,
                ResolvedAt = null
            }
        };
    }

    /// <summary>
    /// SA xử lý tranh chấp và gửi lại hóa đơn (UC-RES-05 E2). saId từ token.
    /// INVOICE_DISPUTED → INVOICE_SENT. BR-26.
    /// </summary>
    public async Task<ResolveDisputeResultDto> ResolveDisputeAsync(
        int rescueId,
        int saId,
        ResolveDisputeDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForResolveDispute.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Không thể xử lý tranh chấp. Trạng thái hiện tại: {rescue.Status}. Yêu cầu: INVOICE_DISPUTED."
            );

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException(
                "Chỉ Service Advisor mới có quyền xử lý tranh chấp hóa đơn."
            );

        if (request.Reissue && !request.AdjustedServiceFee.HasValue)
            throw new ArgumentException("AdjustedServiceFee là bắt buộc khi Reissue=true.");

        if (!rescue.ResultingMaintenanceID.HasValue)
            throw new InvalidOperationException(
                "Rescue không có Repair Order. Không thể xử lý tranh chấp."
            );

        var maintenance =
            await _rescueRepo.GetMaintenanceByIdAsync(rescue.ResultingMaintenanceID.Value, ct)
            ?? throw new InvalidOperationException("Repair Order không tồn tại.");

        var now = DateTime.UtcNow;

        if (request.Reissue)
        {
            // Tính lại hóa đơn, giữ nguyên member discount % (BR-24)
            var adjustedFee = request.AdjustedServiceFee!.Value;
            var discount = request.AdjustedManualDiscount;

            if (discount > adjustedFee)
                throw new ArgumentException(
                    "Giảm giá thủ công không được vượt quá phí dịch vụ điều chỉnh."
                );

            var memberPercent = maintenance.MemberDiscountPercent;
            var memberAmount = Math.Round(adjustedFee * memberPercent / 100m, 2);

            maintenance.TotalAmount = adjustedFee;
            maintenance.DiscountAmount = discount;
            maintenance.MemberDiscountAmount = memberAmount;
            maintenance.FinalAmount = adjustedFee - discount - memberAmount;
        }

        // Ghi resolution notes vào audit trail (BR-26)
        var existingNotes = string.IsNullOrWhiteSpace(maintenance.Notes)
            ? ""
            : maintenance.Notes + "\n";
        maintenance.Notes =
            existingNotes + $"[RESOLUTION {now:yyyy-MM-dd HH:mm}] {request.ResolutionNotes.Trim()}";
        await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);

        rescue.Status = RescueStatus.InvoiceSent;
        await _rescueRepo.UpdateAsync(rescue, ct);

        var invoiceBase = MapToInvoiceDetail(
            maintenance,
            rescue,
            RescueStatus.InvoiceSent,
            maintenance.CreatedDate
        );

        return new ResolveDisputeResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.InvoiceSent,
            Invoice = new ResolvedInvoiceDto
            {
                BaseAmount = invoiceBase.BaseAmount,
                ManualDiscountAmount = invoiceBase.ManualDiscountAmount,
                MembershipRankApplied = invoiceBase.MembershipRankApplied,
                MemberDiscountPercent = invoiceBase.MemberDiscountPercent,
                MemberDiscountAmount = invoiceBase.MemberDiscountAmount,
                FinalAmount = invoiceBase.FinalAmount,
                DepositAppliedAmount = invoiceBase.DepositAppliedAmount,
                OutstandingAmount = invoiceBase.OutstandingAmount,
                Notes = invoiceBase.Notes,
                CreatedAt = invoiceBase.CreatedAt,
                InvoiceStatus = InvoiceStatus.Sent,
                SentAt = now,
                IsReissued = request.Reissue,
                ResolutionNotes = request.ResolutionNotes.Trim()
            }
        };
    }

    // =========================================================================
    // UC-RES-06: Hủy / Spam
    // =========================================================================

    /// <summary>
    /// SA hủy yêu cầu cứu hộ (UC-RES-06 F1). saId từ token.
    /// Bất kỳ trạng thái (trừ COMPLETED/CANCELLED) → CANCELLED. BR-26. SMC06.
    /// </summary>
    public async Task<CancelRescueResultDto> CancelAsync(
        int rescueId,
        int saId,
        CancelRescueDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (RescueStatus.NotCancellable.Contains(rescue.Status))
            throw new InvalidOperationException(
                rescue.Status == RescueStatus.Completed
                    ? "Không thể hủy yêu cầu đã hoàn thành thanh toán."
                    : "Yêu cầu cứu hộ này đã được hủy trước đó."
            );

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền hủy yêu cầu cứu hộ.");

        var now = DateTime.UtcNow;

        // Release technician nếu đang trong nhiệm vụ này (BR-28)
        if (rescue.AssignedTechnicianID.HasValue)
            await _userRepo.SetOnRescueMissionAsync(rescue.AssignedTechnicianID.Value, false, ct);

        // Cancel Repair Order liên kết (nếu có), ghi audit (BR-26)
        if (rescue.ResultingMaintenanceID.HasValue)
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(
                rescue.ResultingMaintenanceID.Value,
                ct
            );
            if (maintenance != null && maintenance.Status != CarMaintenanceStatus.Completed)
            {
                var existing = string.IsNullOrWhiteSpace(maintenance.Notes)
                    ? ""
                    : maintenance.Notes + "\n";
                var reasonNote = string.IsNullOrWhiteSpace(request.Reason)
                    ? "[CANCEL] Yêu cầu cứu hộ bị hủy."
                    : $"[CANCEL {now:yyyy-MM-dd HH:mm}] {request.Reason.Trim()}";

                maintenance.Status = CarMaintenanceStatus.Cancelled;
                maintenance.Notes = existing + reasonNote;
                maintenance.CompletedDate = now;
                await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
            }
        }

        rescue.Status = RescueStatus.Cancelled;
        rescue.CompletedDate = now;
        await _rescueRepo.UpdateAsync(rescue, ct);

        return new CancelRescueResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.Cancelled,
            CancelledAt = now,
            Reason = request.Reason?.Trim()
        };
    }

    /// <summary>
    /// SA đánh dấu Spam (UC-RES-06 F2). saId từ token.
    /// PENDING/REVIEWING → CANCELLED. BR-26. SMC14, SMC06.
    /// </summary>
    public async Task<MarkSpamResultDto> MarkSpamAsync(
        int rescueId,
        int saId,
        MarkSpamDto request,
        CancellationToken ct
    )
    {
        var rescue =
            await _rescueRepo.GetByIdAsync(rescueId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu cứu hộ ID={rescueId} không tồn tại.");

        if (!RescueStatus.AllowedForMarkSpam.Contains(rescue.Status))
            throw new InvalidOperationException(
                $"Chỉ có thể đánh dấu Spam khi yêu cầu ở trạng thái PENDING hoặc REVIEWING. Trạng thái hiện tại: {rescue.Status}."
            );

        var sa =
            await _userRepo.GetByIdAsync(saId, ct)
            ?? throw new KeyNotFoundException("Service Advisor không tồn tại.");
        if (sa.RoleID != UserRole.ServiceAdvisor)
            throw new ArgumentException("Chỉ Service Advisor mới có quyền đánh dấu Spam.");

        var now = DateTime.UtcNow;
        var spamNote = string.IsNullOrWhiteSpace(request.SpamReason)
            ? "[SPAM] Yêu cầu bị đánh dấu Spam."
            : $"[SPAM {now:yyyy-MM-dd HH:mm}] {request.SpamReason.Trim()}";

        rescue.Status = RescueStatus.Cancelled;
        rescue.CompletedDate = now;
        await _rescueRepo.UpdateAsync(rescue, ct);

        // Ghi spam reason vào Repair Order nếu có (BR-26 audit)
        if (rescue.ResultingMaintenanceID.HasValue)
        {
            var maintenance = await _rescueRepo.GetMaintenanceByIdAsync(
                rescue.ResultingMaintenanceID.Value,
                ct
            );
            if (maintenance != null && maintenance.Status != CarMaintenanceStatus.Completed)
            {
                var existing = string.IsNullOrWhiteSpace(maintenance.Notes)
                    ? ""
                    : maintenance.Notes + "\n";
                maintenance.Status = CarMaintenanceStatus.Cancelled;
                maintenance.Notes = existing + spamNote;
                maintenance.CompletedDate = now;
                await _rescueRepo.UpdateMaintenanceAsync(maintenance, ct);
            }
        }

        return new MarkSpamResultDto
        {
            RescueId = rescueId,
            Status = RescueStatus.Cancelled,
            MarkedAsSpam = true,
            SpamReason = request.SpamReason?.Trim(),
            MarkedAt = now
        };
    }

    // =========================================================================
    // Các hàm mapping nội bộ, giữ nhất quán với pattern UserService.MapToDetail()
    // =========================================================================

    /// <summary>Ánh xạ CarMaintenance sang InvoiceDetailDto.</summary>
    private static InvoiceDetailDto MapToInvoiceDetail(
        CarMaintenance m,
        RescueRequest rescue,
        string rescueStatus,
        DateTime createdAt
    ) =>
        new()
        {
            BaseAmount = m.TotalAmount,
            ManualDiscountAmount = m.DiscountAmount,
            MembershipRankApplied = m.RankAtTimeOfService,
            MemberDiscountPercent = m.MemberDiscountPercent,
            MemberDiscountAmount = m.MemberDiscountAmount,
            FinalAmount = m.FinalAmount ?? m.TotalAmount,
            DepositAppliedAmount = GetDepositAppliedAmount(rescue, m.FinalAmount ?? m.TotalAmount),
            OutstandingAmount = GetOutstandingAmount(rescue, m.FinalAmount ?? m.TotalAmount),
            Notes = m.Notes,
            CreatedAt = createdAt,
            InvoiceStatus = InvoiceStatus.FromRescueStatus(rescueStatus)
        };

    /// <summary>Ánh xạ entity RescueRequest (đã load navigation props) sang DTO chi tiết.</summary>

    private async Task<RescueRequestDetailDto> MapToDetailAsync(RescueRequest r, CancellationToken ct)
    {
        var suggestedParts = await DeserializeSuggestedPartsAsync(r.SuggestedPartsJson, ct);

        return new RescueRequestDetailDto
        {
            RescueId = r.RescueID,
            Status = r.Status,
            RescueType = r.RescueType,
            CurrentAddress = r.CurrentAddress,
            Latitude = r.Latitude,
            Longitude = r.Longitude,
            ProblemDescription = r.ProblemDescription,
            ImageEvidence = r.ImageEvidence,
            ServiceFee = r.ServiceFee,
            SuggestedParts = suggestedParts,
            RequiresDeposit = r.RequiresDeposit,
            DepositAmount = r.DepositAmount,
            IsDepositPaid = r.IsDepositPaid,
            DepositPaidDate = r.DepositPaidDate,
            IsDepositConfirmed = r.IsDepositConfirmed,
            DepositConfirmedDate = r.DepositConfirmedDate,
            DepositConfirmedById = r.DepositConfirmedByID,
            EstimatedArrivalDateTime = r.EstimatedArrivalDateTime,
            CreatedDate = r.CreatedDate,
            CompletedDate = r.CompletedDate,
            CustomerId = r.CustomerID,
            CustomerName = r.Customer.FullName,
            CustomerPhone = r.Customer.Phone,
            CustomerEmail = r.Customer.Email,
            CustomerTrustScore = r.Customer.TrustScore,
            MembershipRank = r.Customer.CurrentRank?.RankName,
            CarId = r.CarID,
            LicensePlate = r.Car.LicensePlate,
            Brand = r.Car.Brand,
            Model = r.Car.Model,
            Year = r.Car.Year,
            Color = r.Car.Color,
            ServiceAdvisorId = r.ServiceAdvisorID,
            ServiceAdvisorName = r.ServiceAdvisor?.FullName,
            AssignedTechnicianId = r.AssignedTechnicianID,
            AssignedTechnicianName = r.AssignedTechnician?.FullName,
            AssignedTechnicianPhone = r.AssignedTechnician?.Phone,
            ResultingMaintenanceId = r.ResultingMaintenanceID
        };
    }

    private async Task<List<SuggestedRescuePartDetailDto>> BuildSuggestedPartSnapshotsAsync(
        IEnumerable<SuggestedRescuePartDto>? suggestedParts,
        CancellationToken ct
    )
    {
        var incomingParts = suggestedParts?.ToList() ?? [];
        if (incomingParts.Any(p => p.PartId <= 0))
            throw new ArgumentException("SuggestedParts chi duoc chua PartId lon hon 0.");
        if (incomingParts.Any(p => p.Quantity <= 0))
            throw new ArgumentException("SuggestedParts chi duoc chua Quantity lon hon 0.");

        var duplicatedPartIds = incomingParts
            .GroupBy(p => p.PartId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();
        if (duplicatedPartIds.Count > 0)
            throw new ArgumentException(
                $"SuggestedParts khong duoc trung PartId. Bi trung: {string.Join(", ", duplicatedPartIds)}."
            );

        var snapshots = new List<SuggestedRescuePartDetailDto>(incomingParts.Count);
        foreach (var part in incomingParts)
        {
            var product =
                await _rescueRepo.GetProductByIdAsync(part.PartId, ct)
                ?? throw new KeyNotFoundException(
                    $"Phu tung ID={part.PartId} khong ton tai hoac khong con hoat dong."
                );

            if (!string.Equals(product.Type, "PART", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException(
                    $"San pham ID={part.PartId} khong phai phu tung nen khong the gan vao buoc de xuat."
                );

            snapshots.Add(new SuggestedRescuePartDetailDto
            {
                PartId = part.PartId,
                PartCode = product.Code,
                PartName = product.Name,
                PartType = product.Type,
                Quantity = part.Quantity,
                UnitPrice = product.Price,
                EstimatedLineAmount = product.Price * part.Quantity
            });
        }

        return snapshots;
    }

    private static string? SerializeSuggestedParts(IReadOnlyCollection<SuggestedRescuePartDetailDto> suggestedParts)
    {
        if (suggestedParts.Count == 0)
            return null;

        return JsonSerializer.Serialize(suggestedParts);
    }

    private async Task<List<SuggestedRescuePartDetailDto>> DeserializeSuggestedPartsAsync(
        string? suggestedPartsJson,
        CancellationToken ct
    )
    {
        if (string.IsNullOrWhiteSpace(suggestedPartsJson))
            return [];

        try
        {
            var detailedParts = JsonSerializer.Deserialize<List<SuggestedRescuePartDetailDto>>(suggestedPartsJson) ?? [];
            return await EnrichSuggestedPartDetailsAsync(detailedParts, ct);
        }
        catch (JsonException)
        {
            try
            {
                var basicParts = JsonSerializer.Deserialize<List<SuggestedRescuePartDto>>(suggestedPartsJson) ?? [];
                return await BuildSuggestedPartDetailsFromBasicAsync(basicParts, ct);
            }
            catch (JsonException)
            {
                try
                {
                    var legacyPartIds = JsonSerializer.Deserialize<List<int>>(suggestedPartsJson) ?? [];
                    var basicParts = legacyPartIds
                        .Distinct()
                        .Select(partId => new SuggestedRescuePartDto { PartId = partId, Quantity = 1 })
                        .ToList();
                    return await BuildSuggestedPartDetailsFromBasicAsync(basicParts, ct);
                }
                catch (JsonException)
                {
                    return [];
                }
            }
        }
    }

    private async Task<List<SuggestedRescuePartDetailDto>> BuildSuggestedPartDetailsFromBasicAsync(
        IEnumerable<SuggestedRescuePartDto> basicParts,
        CancellationToken ct
    )
    {
        var parts = basicParts
            .Select(part => new SuggestedRescuePartDetailDto
            {
                PartId = part.PartId,
                Quantity = part.Quantity
            })
            .ToList();

        return await EnrichSuggestedPartDetailsAsync(parts, ct);
    }

    private async Task<List<SuggestedRescuePartDetailDto>> EnrichSuggestedPartDetailsAsync(
        List<SuggestedRescuePartDetailDto> parts,
        CancellationToken ct
    )
    {
        var productIds = parts
            .Select(part => part.PartId)
            .Where(partId => partId > 0)
            .Distinct()
            .ToList();

        var products = await _rescueRepo.GetProductsByIdsAsync(productIds, ct);
        foreach (var part in parts)
        {
            if (products.TryGetValue(part.PartId, out var product))
            {
                part.PartCode ??= product.Code;
                part.PartName ??= product.Name;
                part.PartType ??= product.Type;
                part.UnitPrice ??= product.Price;
            }

            if (!part.EstimatedLineAmount.HasValue && part.UnitPrice.HasValue)
                part.EstimatedLineAmount = part.UnitPrice.Value * part.Quantity;
        }

        return parts;
    }

    private static decimal GetDepositAppliedAmount(RescueRequest rescue, decimal invoiceFinalAmount)
    {
        if (!rescue.RequiresDeposit || !rescue.IsDepositPaid || !rescue.IsDepositConfirmed)
            return 0m;

        // Không áp tiền cọc vượt quá tổng tiền hóa đơn.
        return Math.Min(rescue.DepositAmount, invoiceFinalAmount);
    }

    private static decimal GetOutstandingAmount(RescueRequest rescue, decimal invoiceFinalAmount)
    {
        // Số tiền còn lại không được âm nếu tiền cọc lớn hơn hoặc bằng tiền hóa đơn.
        var outstanding = invoiceFinalAmount - GetDepositAppliedAmount(rescue, invoiceFinalAmount);
        return outstanding < 0 ? 0 : outstanding;
    }

    private static void EnsureDepositPaid(RescueRequest rescue)
    {
        // Mọi rescue yêu cầu đặt cọc đều bị chặn ở đây cho đến khi khách gửi cọc và SA xác nhận đã nhận cọc.
        if (rescue.RequiresDeposit && (!rescue.IsDepositPaid || !rescue.IsDepositConfirmed))
            throw new InvalidOperationException(
                "Khách hàng phải đóng cọc và được SA xác nhận nhận cọc trước khi xử lý yêu cầu cứu hộ."
            );
    }
}
