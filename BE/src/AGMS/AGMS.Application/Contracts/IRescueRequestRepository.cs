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
        string? status, string? rescueType, int? customerId, int? assignedTechnicianId,
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

    // -------------------------------------------------------------------------
    // UC-RES-02: Điều phối & Sửa ven đường
    // -------------------------------------------------------------------------

    /// <summary>
    /// Tạo mới Repair Order (CarMaintenance) liên kết với rescue (BR-19, BR-07).
    /// Gọi khi kỹ thuật viên xác nhận có thể sửa tại chỗ (start-diagnosis canRepairOnSite=true).
    /// </summary>
    Task<CarMaintenance> CreateMaintenanceAsync(CarMaintenance entity, CancellationToken ct);

    /// <summary>
    /// Lấy Repair Order theo ID để cập nhật notes và status (UC-RES-02)
    /// </summary>
    Task<CarMaintenance?> GetMaintenanceByIdAsync(int maintenanceId, CancellationToken ct);

    /// <summary>
    /// Cập nhật Notes, Status, TotalAmount, CompletedDate của Repair Order
    /// </summary>
    Task UpdateMaintenanceAsync(CarMaintenance entity, CancellationToken ct);

    /// <summary>
    /// Thêm một dòng vật tư/dịch vụ vào Repair Order (BR-20, SMC08).
    /// Trả về entity đã load Product navigation để map sang DTO.
    /// </summary>
    Task<ServiceDetail> AddServiceDetailAsync(ServiceDetail item, CancellationToken ct);

    /// <summary>
    /// Lấy toàn bộ vật tư/dịch vụ của một Repair Order theo maintenanceId
    /// </summary>
    Task<IEnumerable<RepairItemResponseDto>> GetRepairItemsAsync(int maintenanceId, CancellationToken ct);

    /// <summary>
    /// Lấy thông tin sản phẩm để validate khi ghi vật tư (BR-20)
    /// </summary>
    Task<Product?> GetProductByIdAsync(int productId, CancellationToken ct);
    Task<IReadOnlyDictionary<int, Product>> GetProductsByIdsAsync(IEnumerable<int> productIds, CancellationToken ct);

    /// <summary>
    /// Kiểm tra xe có đang có Repair Order active không (BR-11).
    /// Active = Status không phải COMPLETED hoặc CANCELLED.
    /// </summary>
    Task<bool> HasActiveMaintenanceForCarAsync(int carId, CancellationToken ct);

    // -------------------------------------------------------------------------
    // UC-RES-04: Hóa đơn & Thanh toán
    // -------------------------------------------------------------------------

    /// <summary>
    /// Tạo giao dịch thanh toán cho rescue (BR-23, SMP05).
    /// Liên kết với Repair Order qua MaintenanceID.
    /// </summary>
    Task<PaymentTransaction> CreatePaymentTransactionAsync(PaymentTransaction entity, CancellationToken ct);

    /// <summary>
    /// Lấy giao dịch thanh toán gần nhất của một Repair Order.
    /// Dùng để kiểm tra trạng thái thanh toán trong D2 GET invoice.
    /// </summary>
    Task<PaymentTransaction?> GetPaymentByMaintenanceIdAsync(int maintenanceId, CancellationToken ct);
}
