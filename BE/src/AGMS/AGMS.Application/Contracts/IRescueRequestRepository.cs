using AGMS.Application.DTOs.Rescue;
using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

/// <summary>
/// Contract truy cập dữ liệu cho module cứu hộ
/// </summary>
public interface IRescueRequestRepository
{
    /// <summary>
    /// Lấy yêu cầu cứu hộ theo ID kèm đầy đủ navigation properties
    /// (Customer → CurrentRank, Car, ServiceAdvisor, AssignedTechnician)
    /// </summary>
    Task<RescueRequest?> GetByIdAsync(int id, CancellationToken ct);

    /// <summary>
    /// Lấy danh sách yêu cầu cứu hộ theo bộ lọc, trả về DTO projection để tối ưu truy vấn
    /// </summary>
    Task<IEnumerable<RescueRequestListItemDto>> GetListAsync(
        string? status, string? rescueType, int? customerId,
        DateTime? fromDate, DateTime? toDate, CancellationToken ct);

    /// <summary>Tạo mới yêu cầu cứu hộ</summary>
    Task AddAsync(RescueRequest entity, CancellationToken ct);

    /// <summary>
    /// Cập nhật trạng thái và các trường thay đổi theo workflow của yêu cầu cứu hộ
    /// </summary>
    Task UpdateAsync(RescueRequest entity, CancellationToken ct);

    /// <summary>
    /// Lấy danh sách kỹ thuật viên đang rảnh (IsOnRescueMission = false, IsActive = true)
    /// Dùng cho SA tham chiếu khi đánh giá — BR-28
    /// </summary>
    Task<IEnumerable<AvailableTechnicianDto>> GetAvailableTechniciansAsync(CancellationToken ct);

    /// <summary>
    /// Lấy thông tin xe theo ID — dùng để validate khi tạo yêu cầu cứu hộ
    /// </summary>
    Task<Car?> GetCarByIdAsync(int carId, CancellationToken ct);
}
