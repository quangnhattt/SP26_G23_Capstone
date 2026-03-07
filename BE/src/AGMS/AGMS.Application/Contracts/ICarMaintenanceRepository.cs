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
        Task<IEnumerable<ServiceOrderListItemDto>> GetServiceOrdersForStaffAsync(CancellationToken ct = default);
        Task<ServiceOrderIntakeDetailDto?> GetServiceOrderIntakeDetailAsync(int maintenanceId, CancellationToken ct = default);
    }
}