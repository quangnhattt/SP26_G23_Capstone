using AGMS.Application.DTOs.Inventory;

namespace AGMS.Application.Contracts
{
    public interface IInventoryRepository
    {
        // Hàm cơ bản của Repository
        Task ExecuteInventoryMovementAsync(
            int productId,
            int referenceId,
            string transactionType,
            decimal quantityChange,
            decimal inputPrice,
            string note,
            CancellationToken ct);

        // Hàm đối soát
        Task<List<InventoryDiscrepancyDto>> GetInventoryDiscrepanciesAsync(CancellationToken ct);
        Task ProcessGoodsReceiptAsync(int createdByUserId, CreateGoodsReceiptDto request, CancellationToken ct);
        Task<CreateIssueTransferOrderResultDto> CreateIssueTransferOrderFromServiceOrderAsync(
            int maintenanceId,
            int createdByUserId,
            CancellationToken ct);
        Task ProcessStockIssueAsync(int transferOrderId, int approvedByUserId, CancellationToken ct);
        
        // Luồng Hoàn trả xuất lố 2 bước (Đối soát bằng Ledger)
        Task<int> CreateSurplusReturnDraftAsync(int maintenanceId, int processedByUserId, CancellationToken ct);
        Task<(List<int> DraftIds, List<string> Errors)> AutoDetectAndCreateSurplusReturnsAsync(int processedByUserId, CancellationToken ct);
        Task ApproveSurplusReturnAsync(int transferOrderId, int approvedByUserId, CancellationToken ct);

        Task<PaginatedResult<InventoryTransactionHistoryDto>> GetTransactionHistoryAsync(InventoryTransactionFilterDto filter, CancellationToken ct);
        Task AdjustStockAsync(int userId, InventoryAdjustmentDto request, CancellationToken ct);
        Task RebuildInventoryBalancesAsync(CancellationToken ct);

        // API Xem Transfer Order
        /// <summary>Kỹ thuật viên xem danh sách phiếu xuất kho dành cho đơn mà họ được phân công.</summary>
        Task<List<MyTransferOrderDto>> GetMyTransferOrdersAsync(int technicianUserId, CancellationToken ct);

        /// <summary>Admin/SA xem toàn bộ phiếu xuất kho kèm thông tin chi tiết linh kiện, hỗ trợ filter và phân trang.</summary>
        Task<PaginatedResult<TransferOrderWithDetailsDto>> GetAllTransferOrdersWithDetailsAsync(TransferOrderFilterDto filter, CancellationToken ct);
    }
}