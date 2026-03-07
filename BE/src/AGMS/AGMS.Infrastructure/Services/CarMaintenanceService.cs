using AGMS.Application.Contracts;
using AGMS.Application.DTOs.ServiceOrder;
using System.Numerics;

namespace AGMS.Infrastructure.Services;

public class CarMaintenanceService : ICarMaintenanceService
{
    private readonly ICarMaintenanceRepository _repository;

    public CarMaintenanceService(ICarMaintenanceRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ServiceOrderListItemDto>> GetServiceOrdersAsync(CancellationToken ct = default)
    {
        return await _repository.GetServiceOrdersForStaffAsync(ct);
    }

    public async Task<ServiceOrderIntakeDetailDto?> GetServiceOrderIntakeDetailAsync(int maintenanceId, CancellationToken ct = default)
    {
        return await _repository.GetServiceOrderIntakeDetailAsync(maintenanceId, ct);
    }

    public async Task<WalkInServiceOrderCreateResponseDto> CreateWalkInServiceOrderAsync(WalkInServiceOrderCreateRequest request, int createByUserId, CancellationToken ct = default)
    {
        return await _repository.CreateWalkInServiceOrderAsync(request, createByUserId, ct);
    }
}

