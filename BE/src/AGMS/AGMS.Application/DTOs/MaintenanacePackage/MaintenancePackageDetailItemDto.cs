namespace AGMS.Application.DTOs.MaintenanacePackage;

public class MaintenancePackageDetailItemDto
{
    public int PackageDetailID { get; set; }
    public int PackageID { get; set; }
    public int ProductID { get; set; }
    public decimal Quantity { get; set; }
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    public string? Notes { get; set; }
}

