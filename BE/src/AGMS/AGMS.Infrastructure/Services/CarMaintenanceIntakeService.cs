using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Intake;
using AGMS.Application.DTOs.ServiceOrder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class CarMaintenanceIntakeService : ICarMaintenanceIntakeService
    {
        private readonly ICarMaintenanceIntakeRepository _repository;
        public CarMaintenanceIntakeService(ICarMaintenanceIntakeRepository repository)
        {
            _repository = repository;
        }
        public async Task<IEnumerable<IntakeListItemDto>> GetWaitingIntakesAsync(CancellationToken ct = default)
        {
            return await _repository.GetWaitingIntakesAsync(ct);
        }

        public async Task<IntakeWalkInCreateResponseDto> CreateWalkInIntakeAsync(IntakeWalkInCreateRequest request, int createdByUserId, CancellationToken ct = default)
        {
            return await _repository.CreateWalkInIntakeAsync(request, createdByUserId, ct);
        }

        public async Task<bool> IsStaffUserAsync(int userId, CancellationToken ct = default)
        {
            return await _repository.IsStaffUserAsync(userId, ct);
        }
        public async Task<ServiceOrderIntakeDetailDto?> GetIntakeDetailAsync(int maintenanceId, CancellationToken ct = default)
        {
            return await _repository.GetIntakeDetailAsync(maintenanceId, ct);
        }
        public async Task<ServiceOrderIntakeDetailDto?> UpdateIntakeAsync(int maintenanceId, IntakeUpdateRequest request, int updatedByUserId, CancellationToken ct = default)
        {
            return await _repository.UpdateIntakeAsync(maintenanceId, request, updatedByUserId, ct);

        }
    }
}
