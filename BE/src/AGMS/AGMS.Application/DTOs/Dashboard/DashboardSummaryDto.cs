using System;
using System.Collections.Generic;

namespace AGMS.Application.DTOs.Dashboard
{
    public class DashboardSummaryDto
    {
        // Nhóm 4 thẻ KPIs
        public KpiMetricDto MonthlyRevenue { get; set; } = new();
        public KpiMetricDto InProgressJobs { get; set; } = new();
        public KpiMetricDto TechnicianAllocation { get; set; } = new();
        public KpiMetricDto PendingRequests { get; set; } = new();

        // Nhóm Biểu đồ
        public List<RevenueChartDto> RevenueChart { get; set; } = new();
        public List<JobAllocationPieChartDto> JobAllocationChart { get; set; } = new();

        // Nhóm Danh sách
        public List<UrgentRequestDto> UrgentRequests { get; set; } = new();
        public List<InProgressJobDto> InProgressJobsList { get; set; } = new();

        // Nhóm Footer
        public int TodayCustomersCount { get; set; }
        public double AverageRepairTimeHours { get; set; }
        public int TomorrowAppointmentsCount { get; set; }
    }

    public class DashboardKpiDto
    {
        public KpiMetricDto MonthlyRevenue { get; set; } = new();
        public KpiMetricDto InProgressJobs { get; set; } = new();
        public KpiMetricDto TechnicianAllocation { get; set; } = new();
        public KpiMetricDto PendingRequests { get; set; } = new();
    }

    public class DashboardAnalyticsDto
    {
        public List<RevenueChartDto> RevenueChart { get; set; } = new();
        public List<JobAllocationPieChartDto> JobAllocationChart { get; set; } = new();
    }

    public class DashboardOperationsDto
    {
        public List<UrgentRequestDto> UrgentRequests { get; set; } = new();
        public List<InProgressJobDto> InProgressJobsList { get; set; } = new();
        public int TodayCustomersCount { get; set; }
        public double AverageRepairTimeHours { get; set; }
        public int TomorrowAppointmentsCount { get; set; }
    }

    public class KpiMetricDto
    {
        public decimal Value { get; set; }
        public string DisplayValue { get; set; } = string.Empty;
        public double PercentChange { get; set; }
        public bool IsTrendUp { get; set; }
    }

    public class RevenueChartDto
    {
        public int WeeksAgo { get; set; }
        public decimal TotalRevenue { get; set; }
        public string Label { get; set; } = string.Empty; // e.g. "Tuần trước"
    }

    public class JobAllocationPieChartDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class UrgentRequestDto
    {
        public int RequestID { get; set; }
        public string Type { get; set; } = string.Empty; // "SOS" hoặc "Lỗi nặng"
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
    }

    public class InProgressJobDto
    {
        public int MaintenanceID { get; set; }
        public string CarLicensePlate { get; set; } = string.Empty;
        public string TechnicianName { get; set; } = string.Empty;
        public string CurrentStatus { get; set; } = string.Empty;
    }
}
