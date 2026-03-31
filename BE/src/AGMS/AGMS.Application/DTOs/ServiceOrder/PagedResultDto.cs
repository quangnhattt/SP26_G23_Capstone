using System.Collections.Generic;

namespace AGMS.Application.DTOs.ServiceOrder;

public class ServiceOrderPagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

