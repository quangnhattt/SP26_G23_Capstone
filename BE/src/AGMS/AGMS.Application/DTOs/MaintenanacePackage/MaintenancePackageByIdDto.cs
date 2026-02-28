namespace AGMS.Application.DTOs.MaintenanacePackage;

/// <summary>
/// Thông tin gói bảo trì theo PackageID, KHÔNG bao gồm danh sách products.
/// Dùng cho GET /api/maintenance-packages/{packageId} (load dữ liệu cũ lên form).
/// </summary>
public class MaintenancePackageByIdDto
{
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
}

