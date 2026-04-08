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

        // API Xem Transfer Order
        /// <summary>Kỹ thuật viên xem danh sách phiếu xuất kho dành cho đơn mà họ được phân công.</summary>
        Task<List<MyTransferOrderDto>> GetMyTransferOrdersAsync(int technicianUserId, CancellationToken ct);

        /// <summary>Admin/SA xem toàn bộ phiếu xuất kho kèm chi tiết linh kiện, hỗ trợ filter và phân trang.</summary>
        Task<PaginatedResult<TransferOrderWithDetailsDto>> GetAllTransferOrdersWithDetailsAsync(TransferOrderFilterDto filter, CancellationToken ct);
    }
}