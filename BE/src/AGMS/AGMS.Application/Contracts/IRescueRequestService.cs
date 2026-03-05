using AGMS.Application.DTOs.Rescue;

namespace AGMS.Application.Contracts;

/// <summary>
/// Contract nghiệp vụ cho module cứu hộ (UC-RES-01)
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
}
