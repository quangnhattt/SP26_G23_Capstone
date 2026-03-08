using AGMS.Application.DTOs.Product;

namespace AGMS.Application.DTOs.RepairRequests;

public class ServiceSelectionResponseDto
{
    public IEnumerable<ServiceProductListItemDto> Services { get; set; } = Enumerable.Empty<ServiceProductListItemDto>();
    public IEnumerable<MaintenancePackageRecommendationDto> RecommendedMaintenancePackages { get; set; } = Enumerable.Empty<MaintenancePackageRecommendationDto>();
}

