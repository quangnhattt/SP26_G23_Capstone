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

        // =================================================================
        // ĐÃ SỬA: Hàm Thực Xuất Kho (Truyền đúng 3 tham số như Interface)
        // =================================================================
        public async Task ProcessStockIssueAsync(int transferOrderId, int approvedByUserId, CancellationToken ct)
        {
            // Gọi thẳng xuống Repository hàm "Trùm cuối" mà chúng ta vừa viết
            await _inventoryRepo.ProcessStockIssueAsync(transferOrderId, approvedByUserId, ct);
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

        public async Task<int> CreateSurplusReturnDraftAsync(int maintenanceId, int processedByUserId, CancellationToken ct)
        {
            return await _inventoryRepo.CreateSurplusReturnDraftAsync(maintenanceId, processedByUserId, ct);
        }

        public async Task<List<int>> AutoDetectAndCreateSurplusReturnsAsync(int processedByUserId, CancellationToken ct)
        {
            return await _inventoryRepo.AutoDetectAndCreateSurplusReturnsAsync(processedByUserId, ct);
        }

        public async Task ApproveSurplusReturnAsync(int transferOrderId, int approvedByUserId, CancellationToken ct)
        {
            await _inventoryRepo.ApproveSurplusReturnAsync(transferOrderId, approvedByUserId, ct);
        }

        // Hàm Đối soát
        public async Task<List<InventoryDiscrepancyDto>> AuditInventoryAsync(CancellationToken ct)
        {
            return await _inventoryRepo.GetInventoryDiscrepanciesAsync(ct);
        }

        // API 5: Lấy lịch sử giao dịch (Sổ cái)
        // =================================================================
        public async Task<PaginatedResult<InventoryTransactionHistoryDto>> GetTransactionHistoryAsync(
            InventoryTransactionFilterDto filter,
            CancellationToken ct)
        {
            // Ủy quyền gọi thẳng xuống Repository để lấy data
            return await _inventoryRepo.GetTransactionHistoryAsync(filter, ct);
        }

        public async Task AdjustStockAsync(int userId, InventoryAdjustmentDto request, CancellationToken ct)
        {
            await _inventoryRepo.AdjustStockAsync(userId, request, ct);
        }

        public async Task RebuildInventoryBalancesAsync(CancellationToken ct)
        {
            await _inventoryRepo.RebuildInventoryBalancesAsync(ct);
        }

        // ============================================================
        // API 1: Kỹ thuật viên xem danh sách phiếu xuất kho của mình
        // ============================================================
        public async Task<List<MyTransferOrderDto>> GetMyTransferOrdersAsync(int technicianUserId, CancellationToken ct)
        {
            return await _inventoryRepo.GetMyTransferOrdersAsync(technicianUserId, ct);
        }

        // ============================================================
        // API 2: Admin/SA xem toàn bộ Transfer Order kèm chi tiết
        // ============================================================
        public async Task<PaginatedResult<TransferOrderWithDetailsDto>> GetAllTransferOrdersWithDetailsAsync(
            TransferOrderFilterDto filter, CancellationToken ct)
        {
            return await _inventoryRepo.GetAllTransferOrdersWithDetailsAsync(filter, ct);
        }
    }
}