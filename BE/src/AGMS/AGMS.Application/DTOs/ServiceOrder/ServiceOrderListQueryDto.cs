namespace AGMS.Application.DTOs.ServiceOrder;

public class ServiceOrderListQueryDto
{
    public string? CustomerName { get; set; }
    public string? MaintenanceType { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

