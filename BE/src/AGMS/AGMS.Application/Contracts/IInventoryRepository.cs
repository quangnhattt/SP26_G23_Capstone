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
    }
}