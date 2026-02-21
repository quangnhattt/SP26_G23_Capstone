using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface IMaintenancePackageRepository
{
    Task<IEnumerable<MaintenancePackageDetail>> GetPackagesWithActiveProductDetailsAsync(CancellationToken ct = default);
}