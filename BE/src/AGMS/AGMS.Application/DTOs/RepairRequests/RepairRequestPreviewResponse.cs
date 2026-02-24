namespace AGMS.Application.DTOs.RepairRequests;

public class RepairRequestPreviewResponse
{
    public decimal EstimatedTotalCost { get; set; }
    public int EstimatedTotalMinutes { get; set; }

    public RepairRequestCreateRequest Echo { get; set; } = null!;
}

