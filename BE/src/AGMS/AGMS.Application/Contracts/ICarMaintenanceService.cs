using AGMS.Application.DTOs.ServiceOrder;

namespace AGMS.Application.Contracts;

public interface ICarMaintenanceService
{
    Task<IEnumerable<ServiceOrderListItemDto>> GetServiceOrdersAsync(CancellationToken ct = default);
    Task<MaintenancePrintDto?> GetMaintenancePrintAsync(int maintenanceId, CancellationToken ct = default);

}

