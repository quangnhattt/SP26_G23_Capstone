using AGMS.Application.DTOs.Dashboard;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetDashboardOverviewAsync();
        Task<DashboardKpiDto> GetKpiMetricsAsync();
        Task<DashboardAnalyticsDto> GetAnalyticsAsync();
        Task<DashboardOperationsDto> GetOperationsAsync();
    }
}
