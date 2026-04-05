using AGMS.Application.DTOs.Inventory;

namespace AGMS.Application.Contracts
{
    public interface IInventoryService
    {
        Task<List<InventoryDashboardDto>> GetDashboardDataAsync();

        // Hàm Nhập kho "All-in-one"
        Task ProcessGoodsReceiptAsync(int createdByUserId, CreateGoodsReceiptDto request, CancellationToken ct);

        // Hàm Xuất kho
        Task ProcessStockIssueAsync(int transferOrderId, int approvedByUserId, CancellationToken ct);
        // Tạo phiếu xuất từ service order
        Task<CreateIssueTransferOrderResultDto> CreateIssueTransferOrderFromServiceOrderAsync(
            int maintenanceId,
            int createdByUserId,
            CancellationToken ct);

        // Hàm Đối soát
        Task<List<InventoryDiscrepancyDto>> AuditInventoryAsync(CancellationToken ct);
        Task<PaginatedResult<InventoryTransactionHistoryDto>> GetTransactionHistoryAsync(InventoryTransactionFilterDto filter, CancellationToken ct);
        Task AdjustStockAsync(int userId, InventoryAdjustmentDto request, CancellationToken ct);
        Task RebuildInventoryBalancesAsync(CancellationToken ct);
    }
}