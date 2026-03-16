using AGMS.Application.DTOs.Inventory;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IInventoryRepository
    {
        Task<List<InventoryDashboardDto>> GetInventoryDashboardAsync();
    }
}