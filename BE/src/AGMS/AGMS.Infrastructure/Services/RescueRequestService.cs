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

    // -------------------------------------------------------------------------
    // Private mapping methods — nhất quán với pattern UserService.MapToDetail()
    // -------------------------------------------------------------------------

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
