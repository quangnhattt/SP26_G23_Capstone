using AGMS.Application.DTOs.RepairRequests;

namespace AGMS.Application.Contracts;

public interface IRepairRequestService
{
    Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, CancellationToken ct);
    Task<ServiceSelectionResponseDto> GetServicesAsync(string? serviceType, int? carId, CancellationToken ct);
    Task<IEnumerable<TechnicianListItemDto>> GetTechniciansAsync(IEnumerable<int>? serviceIds, CancellationToken ct);
    Task<RepairRequestPreviewResponse> PreviewAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct);
    Task<RepairRequestDetailDto> CreateAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct);
}

