using AGMS.Application.DTOs.Product;
using AGMS.Application.DTOs.RepairRequests;
using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IRepairRequestRepository
{
    // Lấy danh sách xe của customer theo OwnerID
    Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, CancellationToken ct);

    // Lấy danh sách dịch vụ (Products type = SERVICE) đang active
    Task<IEnumerable<ServiceProductListItemDto>> GetActiveServiceProductsAsync(CancellationToken ct);

    // Lấy thông tin xe theo ID
    Task<Car?> GetCarByIdAsync(int carId, CancellationToken ct);

    // Lấy xe theo ID + OwnerID (validate ownership)
    Task<Car?> GetCarByIdAndOwnerAsync(int carId, int ownerId, CancellationToken ct);

    // Lấy danh sách gói bảo dưỡng active có KilometerMilestone
    Task<IEnumerable<MaintenancePackage>> GetActiveMaintenancePackagesAsync(CancellationToken ct);

    // Lấy danh sách kỹ thuật viên (RoleID = 3, IsActive)
    Task<IEnumerable<TechnicianListItemDto>> GetActiveTechniciansAsync(CancellationToken ct);

    // Lấy kỹ thuật viên theo ID (RoleID = 3, IsActive)
    Task<User?> GetActiveTechnicianByIdAsync(int technicianId, CancellationToken ct);
    Task<string?> GetUserPhoneByIdAsync(int userId, CancellationToken ct);

    // Thêm Appointment mới
    Task AddAppointmentAsync(Appointment appointment, CancellationToken ct);

    // Thêm CarMaintenance mới
    Task AddCarMaintenanceAsync(CarMaintenance maintenance, CancellationToken ct);

    // Lưu triệu chứng gắn với Appointment
    Task AddAppointmentSymptomsAsync(int appointmentId, IEnumerable<int> symptomIds, CancellationToken ct);
}
