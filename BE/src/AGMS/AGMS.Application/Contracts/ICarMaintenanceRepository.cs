using AGMS.Application.DTOs.ServiceOrder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface ICarMaintenanceRepository
    {
        Task<ServiceOrderPagedResultDto<ServiceOrderListItemDto>> GetServiceOrdersForStaffAsync(ServiceOrderListQueryDto query, int? employeeId = null, CancellationToken ct = default);
        Task<MaintenancePrintDto?> GetMaintenancePrintAsync(int maintenanceId,CancellationToken ct=default);
        Task ProposeAdditionalItemsAsync(int maintenanceId,ProposeAdditionalItemsRequest request,CancellationToken ct=default);
        Task<AdditionalItemsDto> GetAdditionalItemsAsync(int maintenanceId, CancellationToken ct = default);
        Task RespondToAdditionalItemsAsync(int maintenanceId, RespondAdditionalItemsRequest request, CancellationToken ct = default);
        Task<MaintenanceInvoiceDto?> GetMaintenanceInvoiceAsync(int maintenanceId,CancellationToken ct = default);
        Task<MaintenanceInvoiceDto?> CreateMaintenanceInvoiceAsync(int maintenanceId,CancellationToken ct = default);
    }
}