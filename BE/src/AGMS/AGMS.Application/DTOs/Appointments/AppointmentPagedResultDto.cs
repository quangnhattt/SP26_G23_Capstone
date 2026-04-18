using System.Collections.Generic;

namespace AGMS.Application.DTOs.Appointments;

public class AppointmentPagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
