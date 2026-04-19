using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Dashboard;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace AGMS.Infrastructure.Repositories
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly CarServiceDbContext _context;

        public DashboardRepository(CarServiceDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardSummaryDto> GetDashboardOverviewAsync()
        {
            var kpis = await GetKpiMetricsAsync();
            var analytics = await GetAnalyticsAsync();
            var operations = await GetOperationsAsync();

            return new DashboardSummaryDto
            {
                MonthlyRevenue = kpis.MonthlyRevenue,
                InProgressJobs = kpis.InProgressJobs,
                TechnicianAllocation = kpis.TechnicianAllocation,
                PendingRequests = kpis.PendingRequests,
                RevenueChart = analytics.RevenueChart,
                JobAllocationChart = analytics.JobAllocationChart,
                UrgentRequests = operations.UrgentRequests,
                InProgressJobsList = operations.InProgressJobsList,
                TodayCustomersCount = operations.TodayCustomersCount,
                AverageRepairTimeHours = operations.AverageRepairTimeHours,
                TomorrowAppointmentsCount = operations.TomorrowAppointmentsCount
            };
        }

        public async Task<DashboardKpiDto> GetKpiMetricsAsync()
        {
            var dto = new DashboardKpiDto();
            var now = DateTime.UtcNow;
            var currentMonthStart = new DateTime(now.Year, now.Month, 1);
            var lastMonthStart = currentMonthStart.AddMonths(-1);

            var currentMonthPayments = await _context.PaymentTransactions
                .Where(p => p.PaymentDate >= currentMonthStart && p.Status == "SUCCESS")
                .SumAsync(p => p.Amount);

            var lastMonthPayments = await _context.PaymentTransactions
                .Where(p => p.PaymentDate >= lastMonthStart && p.PaymentDate < currentMonthStart && p.Status == "SUCCESS")
                .SumAsync(p => p.Amount);

            dto.MonthlyRevenue.Value = currentMonthPayments;
            dto.MonthlyRevenue.DisplayValue = $"{currentMonthPayments:N0} VNĐ";
            dto.MonthlyRevenue.PercentChange = lastMonthPayments == 0 
                ? 100 
                : (double)((currentMonthPayments - lastMonthPayments) / lastMonthPayments * 100);
            dto.MonthlyRevenue.IsTrendUp = currentMonthPayments >= lastMonthPayments;

            var inProgressCount = await _context.CarMaintenances
                .CountAsync(m => m.Status == "IN_PROGRESS" || m.Status == "IN_DIAGNOSIS");
            dto.InProgressJobs.Value = inProgressCount;
            dto.InProgressJobs.DisplayValue = inProgressCount.ToString();
            
            var assignedTechCount = await _context.CarMaintenances
                .Where(m => m.AssignedTechnicianID != null && m.Status != "COMPLETED" && m.Status != "CANCELLED")
                .Select(m => m.AssignedTechnicianID)
                .Distinct()
                .CountAsync();
                
            var totalTechCount = await _context.Users
                .Where(u => u.Role.RoleName == "Technician" && u.IsActive)
                .CountAsync();

            dto.TechnicianAllocation.Value = assignedTechCount;
            dto.TechnicianAllocation.DisplayValue = $"{assignedTechCount}/{totalTechCount} KTV";

            var pendingRescues = await _context.RescueRequests.CountAsync(r => r.Status == "PENDING");
            var pendingAppts = await _context.Appointments.CountAsync(a => a.Status == "PENDING");
            var totalPending = pendingRescues + pendingAppts;
            dto.PendingRequests.Value = totalPending;
            dto.PendingRequests.DisplayValue = totalPending.ToString();

            return dto;
        }

        public async Task<DashboardAnalyticsDto> GetAnalyticsAsync()
        {
            var dto = new DashboardAnalyticsDto();
            var now = DateTime.UtcNow;
            var _42DaysAgo = now.Date.AddDays(-42);

            var past6WeeksData = await _context.PaymentTransactions
                .Where(x => x.Status == "SUCCESS" && x.PaymentDate >= _42DaysAgo)
                .Select(x => new { x.PaymentDate, x.Amount })
                .ToListAsync();

            var weeklyRevenue = past6WeeksData
                .GroupBy(x => (now.Date - x.PaymentDate.Date).Days / 7)
                .Select(g => new RevenueChartDto {
                    WeeksAgo = g.Key,
                    TotalRevenue = g.Sum(x => x.Amount),
                    Label = g.Key == 0 ? "Tuần này" : $"Tuần -{g.Key}"
                })
                .OrderByDescending(x => x.WeeksAgo)
                .ToList();

            for(int i = 5; i >= 0; i--)
            {
                if(!weeklyRevenue.Any(w => w.WeeksAgo == i))
                {
                    dto.RevenueChart.Add(new RevenueChartDto { WeeksAgo = i, TotalRevenue = 0, Label = i == 0 ? "Tuần này" : $"Tuần -{i}" });
                }
                else
                {
                    dto.RevenueChart.Add(weeklyRevenue.First(w => w.WeeksAgo == i));
                }
            }

            var maintenanceData = await _context.CarMaintenances
                .Where(m => m.CreatedDate >= _42DaysAgo)
                .Select(m => new { 
                    m.Status, 
                    HasDraftIssue = m.TransferOrders.Any(to => to.Type == "ISSUE" && to.Status == "DRAFT") 
                })
                .ToListAsync();

            var groupedStatuses = maintenanceData
                .GroupBy(m => m.HasDraftIssue ? "WAITING_FOR_PARTS" : m.Status)
                .Select(g => new JobAllocationPieChartDto { Status = g.Key, Count = g.Count() })
                .ToList();

            var allPossibleStatuses = new[] { "RECEIVED", "QUOTED", "IN_DIAGNOSIS", "IN_PROGRESS", "COMPLETED", "CANCELLED", "WAITING_FOR_PARTS" };
            foreach(var s in allPossibleStatuses)
            {
                var existing = groupedStatuses.FirstOrDefault(x => x.Status == s);
                dto.JobAllocationChart.Add(new JobAllocationPieChartDto { 
                    Status = s, 
                    Count = existing?.Count ?? 0 
                });
            }

            return dto;
        }

        public async Task<DashboardOperationsDto> GetOperationsAsync()
        {
            var dto = new DashboardOperationsDto();
            var now = DateTime.UtcNow;

            dto.UrgentRequests = await _context.RescueRequests
                .Include(r => r.Customer)
                .Where(r => r.Status == "PENDING")
                .OrderBy(r => r.CreatedDate)
                .Take(10)
                .Select(r => new UrgentRequestDto {
                    RequestID = r.RescueID,
                    Type = r.RescueType ?? "Rescue",
                    Description = r.ProblemDescription ?? "Yêu cầu cứu hộ khẩn cấp",
                    CreatedDate = r.CreatedDate,
                    Status = r.Status,
                    CustomerName = r.Customer.FullName ?? r.Phone ?? "Khách vãng lai"
                }).ToListAsync();

            dto.InProgressJobsList = await _context.CarMaintenances
                .Include(m => m.Car)
                .Include(m => m.AssignedTechnician)
                .Where(m => m.Status == "IN_PROGRESS" || m.Status == "IN_DIAGNOSIS")
                .OrderByDescending(m => m.CreatedDate)
                .Take(10)
                .Select(m => new InProgressJobDto {
                    MaintenanceID = m.MaintenanceID,
                    CarLicensePlate = m.Car.LicensePlate,
                    TechnicianName = m.AssignedTechnician != null ? m.AssignedTechnician.FullName : "Chưa gắn",
                    CurrentStatus = m.Status
                }).ToListAsync();

            var today = now.Date;
            var tomorrow = today.AddDays(1);

            dto.TodayCustomersCount = await _context.CarMaintenances
                .Where(m => m.CreatedDate >= today)
                .Select(m => m.CarID)
                .Distinct()
                .CountAsync();

            dto.TomorrowAppointmentsCount = await _context.Appointments
                .Where(a => a.AppointmentDate >= tomorrow && a.AppointmentDate < tomorrow.AddDays(1))
                .CountAsync();

            var completedJobs = await _context.CarMaintenances
                .Where(m => m.Status == "COMPLETED" && m.CompletedDate != null)
                .OrderByDescending(m => m.CompletedDate)
                .Take(50)
                .Select(m => new { m.CreatedDate, m.CompletedDate })
                .ToListAsync();

            if (completedJobs.Any())
            {
                var avgTicks = completedJobs.Average(m => (m.CompletedDate!.Value - m.CreatedDate).Ticks);
                dto.AverageRepairTimeHours = Math.Round(TimeSpan.FromTicks((long)avgTicks).TotalHours, 1);
            }

            return dto;
        }
    }
}
