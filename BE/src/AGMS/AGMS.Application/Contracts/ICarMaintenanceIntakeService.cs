using AGMS.Application.DTOs.Intake;
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
        Task<IEnumerable<IntakeListItemDto>> GetWaitingIntakesAsync(CancellationToken ct = default);
        Task<IntakeWalkInCreateResponseDto> CreateWalkInIntakeAsync(IntakeWalkInCreateRequest request, int createdByUserId, CancellationToken ct = default);
    }
}

