using System.Collections.Generic;

namespace AGMS.Application.DTOs.Appointments;

public class AppointmentStatusSummary
{
    public int Total { get; set; }
    public int Pending { get; set; }
    public int Confirmed { get; set; }
    public int CheckedIn { get; set; }
    public int Cancelled { get; set; }
    public int Today { get; set; }
}

public class AppointmentPagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public AppointmentStatusSummary Summary { get; set; } = new();
}
