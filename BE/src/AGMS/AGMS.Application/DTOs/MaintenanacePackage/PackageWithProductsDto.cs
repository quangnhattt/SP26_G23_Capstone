namespace AGMS.Application.DTOs.MaintenanacePackage;

public class PackageWithProductsDto
{
    public string PackageCode { get; set; } = null!;
    public string PackageName { get; set; } = null!;
    public decimal? PackageTotalPrice { get; set; }
    public List<PackageProductItemDto> Products { get; set; } = new();
}
