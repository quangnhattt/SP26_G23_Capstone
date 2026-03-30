using AGMS.Application.DTOs.RepairRequests;
using AGMS.Application.DTOs.Scheduling;

namespace AGMS.Application.Contracts;

public interface IRepairRequestService
{
    Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, CancellationToken ct);
    Task<ServiceSelectionResponseDto> GetServicesAsync(string? serviceType, int? carId, CancellationToken ct);
    Task<IEnumerable<TechnicianListItemDto>> GetTechniciansAsync(IEnumerable<int>? serviceIds, CancellationToken ct);
    Task<RepairRequestPreviewResponse> PreviewAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct);
    Task<RepairRequestDetailDto> CreateAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct);

    // === Scheduling ===

    /// <summary>Lấy danh sách slot khả dụng trong 1 ngày</summary>
    Task<DayAvailabilityDto> GetAvailableSlotsAsync(string date, CancellationToken ct);

    /// <summary>Lấy danh sách KTV rảnh trong 1 slot cụ thể</summary>
    Task<IEnumerable<SlotTechnicianDto>> GetAvailableTechniciansInSlotAsync(string date, string time, CancellationToken ct);
}

