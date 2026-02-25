using AGMS.Domain.Entities;

namespace AGMS.Application.DTOs.MaintenanacePackage;

public class MaintenancePackageDetailDto
{
    // Thông tin gói (đầy đủ trường trong MaintenancePackage)
    public int PackageID { get; set; }
    public string PackageCode { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int? KilometerMilestone { get; set; }
    public int? MonthMilestone { get; set; }
    public decimal BasePrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal? FinalPrice { get; set; }
    public decimal? EstimatedDurationHours { get; set; }
    public string? ApplicableBrands { get; set; }
    public string? Image { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? CreatedBy { get; set; }

    // Danh sách sản phẩm đang active trong gói
    public List<PackageProductItemDto> Products { get; set; } = new();
}

