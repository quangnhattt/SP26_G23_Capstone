using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Dashboard;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IDashboardRepository _dashboardRepository;

        public DashboardService(IDashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        public async Task<DashboardSummaryDto> GetDashboardOverviewAsync()
        {
            return await _dashboardRepository.GetDashboardOverviewAsync();
        }

        public async Task<DashboardKpiDto> GetKpiMetricsAsync()
        {
            return await _dashboardRepository.GetKpiMetricsAsync();
        }

        public async Task<DashboardAnalyticsDto> GetAnalyticsAsync()
        {
            return await _dashboardRepository.GetAnalyticsAsync();
        }

        public async Task<DashboardOperationsDto> GetOperationsAsync()
        {
            return await _dashboardRepository.GetOperationsAsync();
        }
    }
}
