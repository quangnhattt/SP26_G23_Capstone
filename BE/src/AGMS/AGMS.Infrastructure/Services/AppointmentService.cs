using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Appointments;

namespace AGMS.Infrastructure.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _repo;

    public AppointmentService(IAppointmentRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<AppointmentListItemDto>> GetListAsync(int currentUserId, bool isServiceAdvisor, AppointmentFilterDto filter, CancellationToken ct)
    {
        // Customer: ownerUserId để repo lọc. SA: null để trả tất cả
        int? ownerUserId = isServiceAdvisor ? null : currentUserId;

        // CustomerId filter chỉ SA mới được dùng
        if (!isServiceAdvisor)
            filter.CustomerId = null;

        return await _repo.GetListAsync(ownerUserId, filter, ct);
    }

    public async Task<AppointmentDetailDto?> GetDetailAsync(int appointmentId, int currentUserId, bool isServiceAdvisor, CancellationToken ct)
    {
        int? ownerUserId = isServiceAdvisor ? null : currentUserId;
        var appointment = await _repo.GetByIdAsync(appointmentId, ownerUserId, ct);

        if (appointment == null)
            return null;

        var detail = new AppointmentDetailDto
        {
            AppointmentId = appointment.AppointmentID,
            CarId = appointment.CarID,
            AppointmentDate = appointment.AppointmentDate,
            ServiceType = appointment.ServiceType,
            RequestedPackageId = appointment.RequestedPackageID,
            Status = appointment.Status,
            Notes = appointment.Notes,
            CreatedBy = appointment.CreatedBy,
            CreatedDate = appointment.CreatedDate,
            ConfirmedBy = appointment.ConfirmedBy,
            ConfirmedDate = appointment.ConfirmedDate,
            Car = new CarInfoDto
            {
                CarId = appointment.Car.CarID,
                LicensePlate = appointment.Car.LicensePlate,
                Brand = appointment.Car.Brand,
                Model = appointment.Car.Model,
                Year = appointment.Car.Year,
                Color = appointment.Car.Color,
                CurrentOdometer = appointment.Car.CurrentOdometer
            },
            Customer = new CustomerInfoDto
            {
                UserId = appointment.CreatedByNavigation.UserID,
                FullName = appointment.CreatedByNavigation.FullName,
                Phone = appointment.CreatedByNavigation.Phone,
                Email = appointment.CreatedByNavigation.Email
            }
        };

        if (appointment.RequestedPackage != null)
        {
            detail.Package = new PackageInfoDto
            {
                PackageId = appointment.RequestedPackage.PackageID,
                PackageName = appointment.RequestedPackage.Name,
                PackageCode = appointment.RequestedPackage.PackageCode,
                FinalPrice = appointment.RequestedPackage.FinalPrice
            };
        }

        var maintenance = appointment.CarMaintenances.FirstOrDefault();
        if (maintenance != null)
        {
            detail.Maintenance = new CarMaintenanceInfoDto
            {
                MaintenanceId = maintenance.MaintenanceID,
                MaintenanceType = maintenance.MaintenanceType,
                AssignedTechnicianId = maintenance.AssignedTechnicianID,
                TotalAmount = maintenance.TotalAmount,
                FinalAmount = maintenance.FinalAmount,
                Status = maintenance.Status
            };
        }

        return detail;
    }

    /// <summary>
    /// Chỉ user có RoleID = 2 (Service Advisor) mới được gọi. Controller đã check, Service check lại để chắc chắn.
    /// </summary>
    public async Task ApproveAsync(int appointmentId, int currentUserId, CancellationToken ct)
    {
        var roleId = await _repo.GetUserRoleIdAsync(currentUserId, ct);
        if (roleId != 2)
            throw new UnauthorizedAccessException("Only Service Advisor (RoleID = 2) can approve appointments.");

        await _repo.ApproveAsync(appointmentId, currentUserId, ct);
    }

    public async Task RejectAsync(int appointmentId, int currentUserId, CancellationToken ct)
    {
        var roleID= await _repo.GetUserRoleIdAsync(currentUserId, ct);
        if(roleID!=2)
            throw new UnauthorizedAccessException("Only Service Advisor (RoleID = 2) can reject appointments.");
        await _repo.RejectAsync(appointmentId, currentUserId, ct);
    }

    public async Task CheckInAsync(int appointmentId, int currentUserId, CancellationToken ct)
    {
        var roleId = await _repo.GetUserRoleIdAsync(currentUserId, ct);
        if (roleId != 2)
            throw new UnauthorizedAccessException("Only Service Advisor (RoleID = 2) can check in appointments.");

        await _repo.CheckInAsync(appointmentId, currentUserId, ct);
    }
}
