using AGMS.Application.DTOs.Inventory;

namespace AGMS.Application.Contracts
{
    public interface IInventoryService
    {
        Task<List<InventoryDashboardDto>> GetDashboardDataAsync();

        // Hàm Nhập kho "All-in-one"
        Task ProcessGoodsReceiptAsync(int createdByUserId, CreateGoodsReceiptDto request, CancellationToken ct);

        // Hàm Xuất kho
        Task ProcessStockIssueAsync(int productId, int transferOrderId, decimal quantity, string note, CancellationToken ct);

        // Hàm Đối soát
        Task<List<InventoryDiscrepancyDto>> AuditInventoryAsync(CancellationToken ct);
    }
}