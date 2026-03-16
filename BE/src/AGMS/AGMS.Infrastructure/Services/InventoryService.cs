using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Inventory;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _inventoryRepo;

        public InventoryService(IInventoryRepository inventoryRepo)
        {
            _inventoryRepo = inventoryRepo;
        }

        public async Task<List<InventoryDashboardDto>> GetDashboardDataAsync()
        {
            
            return await _inventoryRepo.GetInventoryDashboardAsync();
        }
    }
}