namespace AGMS.Application.DTOs.MaintenanacePackage;

/// <summary>
/// Một sản phẩm/dịch vụ trong gói bảo trì.
/// </summary>
public class PackageProductItemDto
{
    public int PackageDetailID { get; set; }
    public int ProductID { get; set; }
    public string ProductName { get; set; } = null!;
    public decimal Quantity { get; set; }
    public bool ProductStatus { get; set; }
    public int DisplayOrder { get; set; }
}
