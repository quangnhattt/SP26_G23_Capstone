using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Inventory;
using System;
using System.Collections.Generic;
using System.Threading;
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

        public Task<List<InventoryDashboardDto>> GetDashboardDataAsync()
        {
            throw new NotImplementedException();
        }

        // Hàm Nhập kho All-in-one
        public async Task ProcessGoodsReceiptAsync(int createdByUserId, CreateGoodsReceiptDto request, CancellationToken ct)
        {
            await _inventoryRepo.ProcessGoodsReceiptAsync(createdByUserId, request, ct);
        }

        // Hàm Xuất kho - Dùng các tham số rời
        public async Task ProcessStockIssueAsync(int productId, int transferOrderId, decimal quantity, string note, CancellationToken ct)
        {
            await _inventoryRepo.ExecuteInventoryMovementAsync(
                productId, transferOrderId, "ISSUE", quantity, 0, note, ct);
        }

        public async Task<CreateIssueTransferOrderResultDto> CreateIssueTransferOrderFromServiceOrderAsync(
            int maintenanceId,
            int createdByUserId,
            CancellationToken ct)
        {
            return await _inventoryRepo.CreateIssueTransferOrderFromServiceOrderAsync(
                maintenanceId,
                createdByUserId,
                ct);
        }

        // Hàm Đối soát
        public async Task<List<InventoryDiscrepancyDto>> AuditInventoryAsync(CancellationToken ct)
        {
            return await _inventoryRepo.GetInventoryDiscrepanciesAsync(ct);
        }
    }
}