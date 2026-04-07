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

    public async Task<ServiceOrderPagedResultDto<ServiceOrderListItemDto>> GetServiceOrdersAsync(ServiceOrderListQueryDto query, int? employeeId = null, CancellationToken ct = default)
    {
        return await _repository.GetServiceOrdersForStaffAsync(query, employeeId, ct);
    }
    public async Task<MaintenancePrintDto?> GetMaintenancePrintAsync(int maintenanceId, CancellationToken ct = default)
    {
        return await _repository.GetMaintenancePrintAsync(maintenanceId, ct);
    }

    public async Task ProposeAdditionalItemsAsync(int maintenanceId, ProposeAdditionalItemsRequest request, CancellationToken ct = default)
    {
        await _repository.ProposeAdditionalItemsAsync(maintenanceId, request, ct);
    }

    public async Task<AdditionalItemsDto> GetAdditionalItemsAsync(int maintenanceId, CancellationToken ct = default)
    {
        return await _repository.GetAdditionalItemsAsync(maintenanceId, ct);
    }

    public async Task RespondToAdditionalItemsAsync(int maintenanceId, RespondAdditionalItemsRequest request, CancellationToken ct = default)
    {
        await _repository.RespondToAdditionalItemsAsync(maintenanceId, request, ct);
    }
    public async Task<MaintenanceInvoiceDto?> GetMaintenanceInvoiceAsync(int maintenanceId,CancellationToken ct = default)
    {
        return await _repository.GetMaintenanceInvoiceAsync(maintenanceId, ct);
    }

    public async Task<MaintenanceInvoiceDto?> CreateMaintenanceInvoiceAsync(int maintenanceId, CancellationToken ct = default)
    {
        return await _repository.CreateMaintenanceInvoiceAsync(maintenanceId, ct);
    }

    public async Task<bool> AssignTechnicianAsync(int maintenanceId, int technicianId, CancellationToken ct = default)
    {
        return await _repository.AssignTechnicianAsync(maintenanceId, technicianId, ct);
    }

    public async Task<bool> StartDiagnosisAsync(int maintenanceId, int updatedByUserId, CancellationToken ct = default)
    {
        return await _repository.StartDiagnosisAsync(maintenanceId, updatedByUserId, ct);
    }
}

