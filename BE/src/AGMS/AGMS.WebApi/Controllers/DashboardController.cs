using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace AGMS.WebApi.Controllers
{
    [Route("api/v1/dashboard")]
    [ApiController]
    [Authorize(Roles = Roles.Admin + "," + Roles.ServiceAdvisor)]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly IMemoryCache _memoryCache;

        public DashboardController(IDashboardService dashboardService, IMemoryCache memoryCache)
        {
            _dashboardService = dashboardService;
            _memoryCache = memoryCache;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetDashboardOverview(CancellationToken ct)
        {
            try
            {
                string cacheKey = "AdminDashboardOverview";
                if (!_memoryCache.TryGetValue(cacheKey, out DashboardSummaryDto? data) || data == null)
                {
                    data = await _dashboardService.GetDashboardOverviewAsync();

                    var cacheOptions = new MemoryCacheEntryOptions()
                          .SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
                    _memoryCache.Set(cacheKey, data, cacheOptions);
                }

                return Ok(new
                {
                    message = "Lấy dữ liệu tổng quan Dashboard thành công.",
                    data = data
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy dữ liệu Dashboard.", detail = ex.Message });
            }
        }

        [HttpGet("kpi-metrics")]
        public async Task<IActionResult> GetKpiMetrics(CancellationToken ct)
        {
            try
            {
                string cacheKey = "AdminDashboardKpi";
                if (!_memoryCache.TryGetValue(cacheKey, out DashboardKpiDto? data) || data == null)
                {
                    data = await _dashboardService.GetKpiMetricsAsync();
                    var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
                    _memoryCache.Set(cacheKey, data, cacheOptions);
                }
                return Ok(new { message = "Lấy chỉ số KPI thành công.", data = data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy chỉ số KPI.", detail = ex.Message });
            }
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics(CancellationToken ct)
        {
            try
            {
                string cacheKey = "AdminDashboardAnalytics";
                if (!_memoryCache.TryGetValue(cacheKey, out DashboardAnalyticsDto? data) || data == null)
                {
                    data = await _dashboardService.GetAnalyticsAsync();
                    var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
                    _memoryCache.Set(cacheKey, data, cacheOptions);
                }
                return Ok(new { message = "Lấy dữ liệu phân tích thành công.", data = data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy dữ liệu phân tích.", detail = ex.Message });
            }
        }

        [HttpGet("operations")]
        public async Task<IActionResult> GetOperations(CancellationToken ct)
        {
            try
            {
                string cacheKey = "AdminDashboardOperations";
                if (!_memoryCache.TryGetValue(cacheKey, out DashboardOperationsDto? data) || data == null)
                {
                    data = await _dashboardService.GetOperationsAsync();
                    var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(2));
                    _memoryCache.Set(cacheKey, data, cacheOptions);
                }
                return Ok(new { message = "Lấy dữ liệu vận hành thành công.", data = data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy dữ liệu vận hành.", detail = ex.Message });
            }
        }
    }
}
