namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// Chi tiet phu tung de xuat de FE hien thi tren man hinh rescue detail.
/// </summary>
public class SuggestedRescuePartDetailDto
{
    public int PartId { get; set; }
    public string? PartCode { get; set; }
    public string? PartName { get; set; }
    public string? PartType { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? EstimatedLineAmount { get; set; }
}
