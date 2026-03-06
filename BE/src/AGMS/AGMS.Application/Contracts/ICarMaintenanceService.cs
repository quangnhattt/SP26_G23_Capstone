using AGMS.Application.DTOs.ServiceOrder;

namespace AGMS.Application.Contracts;

public interface ICarMaintenanceService
{
    Task<IEnumerable<ServiceOrderListItemDto>> GetServiceOrdersAsync(CancellationToken ct = default);
    Task<WalkInServiceOrderCreateResponseDto> CreateWalkInServiceOrderAsync(WalkInServiceOrderCreateRequest request, int createByUserId, CancellationToken ct = default);
}

