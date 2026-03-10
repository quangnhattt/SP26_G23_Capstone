using AGMS.Application.Contracts;
using AGMS.Application.DTOs.ServiceOrder;

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
    public async Task<MaintenancePrintDto?> GetMaintenancePrintAsync(int maintenanceId, CancellationToken ct = default)
    {
        return await _repository.GetMaintenancePrintAsync(maintenanceId, ct);
    }
}

