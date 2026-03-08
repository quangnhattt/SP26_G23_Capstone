using AGMS.Application.Contracts;
using AGMS.Application.DTOs.RepairRequests;
using AGMS.Domain.Entities;

namespace AGMS.Infrastructure.Services;

public class RepairRequestService : IRepairRequestService
{
    private readonly IRepairRequestRepository _repo;

    public RepairRequestService(IRepairRequestRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, CancellationToken ct)
    {
        return await _repo.GetCustomerCarsAsync(userId, ct);
    }

    public async Task<ServiceSelectionResponseDto> GetServicesAsync(string? serviceType, int? carId, CancellationToken ct)
    {
        var services = await _repo.GetActiveServiceProductsAsync(ct);

        var response = new ServiceSelectionResponseDto
        {
            Services = services
        };

        if (!string.IsNullOrWhiteSpace(serviceType)
            && serviceType.Equals("maintenance", StringComparison.OrdinalIgnoreCase)
            && carId.HasValue)
        {
            var car = await _repo.GetCarByIdAsync(carId.Value, ct);

            if (car != null && car.CurrentOdometer > 0)
            {
                var carKm = car.CurrentOdometer;

                var packages = (await _repo.GetActiveMaintenancePackagesAsync(ct)).ToList();

                if (packages.Count > 0)
                {
                    var recommended = packages
                        .OrderBy(p => Math.Abs((p.KilometerMilestone ?? 0) - carKm))
                        .Take(5)
                        .Select(p => new MaintenancePackageRecommendationDto
                        {
                            PackageId = p.PackageID,
                            PackageCode = p.PackageCode,
                            PackageName = p.Name,
                            KilometerMilestone = p.KilometerMilestone,
                            EstimatedDurationHours = p.EstimatedDurationHours,
                            FinalPrice = p.FinalPrice ?? p.BasePrice
                        })
                        .ToList();

                    response.RecommendedMaintenancePackages = recommended;
                }
            }
        }

        return response;
    }

    public async Task<IEnumerable<TechnicianListItemDto>> GetTechniciansAsync(IEnumerable<int>? serviceIds, CancellationToken ct)
    {
        return await _repo.GetActiveTechniciansAsync(ct);
    }

    public async Task<RepairRequestPreviewResponse> PreviewAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct)
    {
        var (car, technician, appointmentServiceType) = await ValidateAndLoadCoreDataAsync(request, userId, ct);

        var (totalCost, totalMinutes) = GetEstimatedCostAndMinutes(appointmentServiceType);

        return new RepairRequestPreviewResponse
        {
            EstimatedTotalCost = totalCost,
            EstimatedTotalMinutes = totalMinutes,
            Echo = request
        };
    }

    public async Task<RepairRequestDetailDto> CreateAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct)
    {
        var (car, technician, appointmentServiceType) = await ValidateAndLoadCoreDataAsync(request, userId, ct);

        var (totalCost, _) = GetEstimatedCostAndMinutes(appointmentServiceType);
        var maintenanceType = MapMaintenanceTypeForCarMaintenance(request.ServiceType);

        var preferredDate = ParsePreferredDate(request.PreferredDate);
        var preferredTime = ParsePreferredTime(request.PreferredTime);
        var appointmentDateTime = preferredDate.ToDateTime(preferredTime);

        var appointment = new Appointment
        {
            CarID = car.CarID,
            AppointmentDate = appointmentDateTime,
            ServiceType = appointmentServiceType,
            RequestedPackageID = null,
            Status = "PENDING",
            Notes = BuildNotes(request),
            CreatedBy = userId,
            CreatedDate = DateTime.UtcNow
        };

        await _repo.AddAppointmentAsync(appointment, ct);

        var maintenance = new CarMaintenance
        {
            CarID = car.CarID,
            AppointmentID = appointment.AppointmentID,
            MaintenanceDate = appointmentDateTime,
            Odometer = car.CurrentOdometer,
            Status = "WAITING",
            TotalAmount = totalCost,
            DiscountAmount = 0m,
            MaintenanceType = maintenanceType,
            MemberDiscountAmount = 0m,
            MemberDiscountPercent = 0m,
            RankAtTimeOfService = null,
            Notes = BuildNotes(request),
            BayID = null,
            CreatedBy = userId,
            AssignedTechnicianID = technician?.UserID,
            TechnicianHistory = null,
            CreatedDate = DateTime.UtcNow,
            CompletedDate = null
        };

        await _repo.AddCarMaintenanceAsync(maintenance, ct);

        return new RepairRequestDetailDto
        {
            AppointmentId = appointment.AppointmentID,
            CarId = car.CarID,
            CreatedByUserId = userId,
            Description = request.Description,
            ServiceType = appointmentServiceType,
            TechnicianId = technician?.UserID,
            PreferredDate = request.PreferredDate,
            PreferredTime = request.PreferredTime,
            CreatedDateUtc = appointment.CreatedDate,
            Status = appointment.Status
        };
    }

    private async Task<(Car car, User? technician, string appointmentServiceType)> ValidateAndLoadCoreDataAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Description))
            throw new ArgumentException("Description is required.", nameof(request.Description));
        if (string.IsNullOrWhiteSpace(request.ServiceType))
            throw new ArgumentException("ServiceType is required. Use 'REPAIR' or 'MAINTENANCE'.", nameof(request.ServiceType));

        var normalizedType = request.ServiceType.Trim().ToLowerInvariant();
        if (normalizedType != "repair" && normalizedType != "maintenance")
            throw new ArgumentException("ServiceType must be 'REPAIR' or 'MAINTENANCE'.", nameof(request.ServiceType));

        var car = await _repo.GetCarByIdAndOwnerAsync(request.CarId, userId, ct)
            ?? throw new InvalidOperationException("Car not found or does not belong to current user.");

        User? technician = null;
        if (request.TechnicianId.HasValue)
        {
            technician = await _repo.GetActiveTechnicianByIdAsync(request.TechnicianId.Value, ct)
                ?? throw new InvalidOperationException("Technician not found or inactive.");
        }

        _ = ParsePreferredDate(request.PreferredDate);
        _ = ParsePreferredTime(request.PreferredTime);

        var appointmentServiceType = normalizedType == "repair" ? "REPAIR" : "MAINTENANCE";
        return (car, technician, appointmentServiceType);
    }

    private static (decimal totalCost, int totalMinutes) GetEstimatedCostAndMinutes(string appointmentServiceType)
    {
        return (0m, 0);
    }

    private static string MapMaintenanceTypeForCarMaintenance(string? serviceType)
    {
        if (string.IsNullOrWhiteSpace(serviceType))
            return "REGULAR";

        var normalized = serviceType.Trim().ToLowerInvariant();
        return normalized switch
        {
            "maintenance" => "REGULAR",
            "repair" => "REPAIR",
            _ => "REGULAR"
        };
    }

    private static DateOnly ParsePreferredDate(string date)
    {
        if (!DateOnly.TryParse(date, out var result))
            throw new ArgumentException("PreferredDate must be a valid date in format yyyy-MM-dd.", nameof(date));
        return result;
    }

    private static TimeOnly ParsePreferredTime(string time)
    {
        if (!TimeOnly.TryParse(time, out var result))
            throw new ArgumentException("PreferredTime must be a valid time in format HH:mm.", nameof(time));
        return result;
    }

    private static string BuildNotes(RepairRequestCreateRequest request)
    {
        return request.Description;
    }
}
