using AGMS.Application.DTOs.ServiceOrder;

namespace AGMS.Application.Contracts;

public interface ICarMaintenanceService
{
    Task<IEnumerable<ServiceOrderListItemDto>> GetServiceOrdersAsync(CancellationToken ct = default);
    Task<MaintenancePrintDto?> GetMaintenancePrintAsync(int maintenanceId, CancellationToken ct = default);
    Task ProposeAdditionalItemsAsync(int maintenanceId, ProposeAdditionalItemsRequest request, CancellationToken ct = default);

    Task<AdditionalItemsDto> GetAdditionalItemsAsync(int maintenanceId, CancellationToken ct = default);

    Task RespondToAdditionalItemsAsync(int maintenanceId, RespondAdditionalItemsRequest request, CancellationToken ct = default);
    Task<MaintenanceInvoiceDto?> GetMaintenanceInvoiceAsync(int maintenanceId,CancellationToken ct = default);
    Task<MaintenanceInvoiceDto?> CreateMaintenanceInvoiceAsync(int maintenanceId, CancellationToken ct = default);
}

