namespace AGMS.Application.DTOs.Inventory;

public class CreateIssueTransferOrderResultDto
{
    public int TransferOrderId { get; set; }
    public int MaintenanceId { get; set; }
    public int ItemCount { get; set; }
}
