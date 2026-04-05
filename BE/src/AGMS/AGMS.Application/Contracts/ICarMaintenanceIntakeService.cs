using AGMS.Application.DTOs.Intake;
using AGMS.Application.DTOs.ServiceOrder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface ICarMaintenanceIntakeService
    {
        Task<bool> IsStaffUserAsync(int userId, CancellationToken ct = default);
        Task<PagedResultDto<IntakeListItemDto>> GetIntakesAsync(IntakeListQueryDto query, int currentUserId, int currentRoleId, CancellationToken ct = default);
        Task<IntakeWalkInCreateResponseDto> CreateWalkInIntakeAsync(IntakeWalkInCreateRequest request, int createdByUserId, CancellationToken ct = default);
        Task<ServiceOrderIntakeDetailDto?> GetIntakeDetailAsync(int maintenanceId, CancellationToken ct = default);
        Task<ServiceOrderIntakeDetailDto?> UpdateIntakeAsync(int maintenanceId, IntakeUpdateRequest request, int updatedByUserId, CancellationToken ct = default);
        Task<bool> StartDiagnosisAsync(int maintenanceId, IntakeStartDiagnosisRequest request, int updatedByUserId, CancellationToken ct = default);

    }
}

