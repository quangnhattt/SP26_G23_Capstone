using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Intake;
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
        public async Task<bool> IsStaffUserAsync(int userId, CancellationToken ct = default)
        {
            return await _repository.IsStaffUserAsync(userId, ct);
        }
    } 
}
