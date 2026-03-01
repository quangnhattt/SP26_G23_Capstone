using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Product;
using AGMS.Application.DTOs.RepairRequests;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Services;

public class RepairRequestService : IRepairRequestService
{
    private readonly CarServiceDbContext _db;

    public RepairRequestService(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, CancellationToken ct)
    {
        return await _db.Cars
            .AsNoTracking()
            .Where(c => c.OwnerID == userId)
            .OrderByDescending(c => c.CreatedDate)
            .Select(c => new CustomerCarListItemDto
            {
                CarId = c.CarID,
                LicensePlate = c.LicensePlate,
                Brand = c.Brand,
                Model = c.Model,
                Year = c.Year,
                Color = c.Color,
                CurrentOdometer = c.CurrentOdometer,
                LastMaintenanceDate = c.LastMaintenanceDate,
                NextMaintenanceDate = c.NextMaintenanceDate
            })
            .ToListAsync(ct);
    }

    public async Task<ServiceSelectionResponseDto> GetServicesAsync(string? serviceType, int? carId, CancellationToken ct)
    {
        var services = await _db.Products
            .AsNoTracking()
            .Where(p => (p.Type == "SERVICE" || p.Type == "Service") && p.IsActive)
            .Select(p => new ServiceProductListItemDto
            {
                Id = p.ProductID,
                Code = p.Code,
                Name = p.Name,
                Price = p.Price,
                Unit = p.Unit != null ? p.Unit.Name : null,
                Category = p.Category != null ? p.Category.Name : null,
                EstimatedDurationHours = p.EstimatedDurationHours,
                Description = p.Description,
                Image = p.Image,
                IsActive = p.IsActive
            })
            .ToListAsync(ct);

        var response = new ServiceSelectionResponseDto
        {
            Services = services
        };

        if (!string.IsNullOrWhiteSpace(serviceType)
            && serviceType.Equals("maintenance", StringComparison.OrdinalIgnoreCase)
            && carId.HasValue)
        {
            var car = await _db.Cars
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CarID == carId.Value, ct);

            if (car != null && car.CurrentOdometer > 0)
            {
                var carKm = car.CurrentOdometer;

                var packages = await _db.MaintenancePackages
                    .AsNoTracking()
                    .Where(p => p.IsActive && p.KilometerMilestone != null)
                    .OrderBy(p => p.KilometerMilestone)
                    .ToListAsync(ct);

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
        var technicians = await _db.Users
            .AsNoTracking()
            .Where(u => u.RoleID == 3 && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new TechnicianListItemDto
            {
                TechnicianId = u.UserID,
                FullName = u.FullName,
                Email = u.Email,
                Phone = u.Phone,
                Skills = u.Skills
            })
            .ToListAsync(ct);

        return technicians;
    }

    public async Task<RepairRequestPreviewResponse> PreviewAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct)
    {
        var (car, technician, package, appointmentServiceType) = await ValidateAndLoadCoreDataAsync(request, userId, ct);

        var (totalCost, totalMinutes) = GetEstimatedCostAndMinutes(appointmentServiceType, package);

        return new RepairRequestPreviewResponse
        {
            EstimatedTotalCost = totalCost,
            EstimatedTotalMinutes = totalMinutes,
            Echo = request
        };
    }

    public async Task<RepairRequestDetailDto> CreateAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct)
    {
        var (car, technician, package, appointmentServiceType) = await ValidateAndLoadCoreDataAsync(request, userId, ct);

        var (totalCost, _) = GetEstimatedCostAndMinutes(appointmentServiceType, package);
        var maintenanceType = MapMaintenanceTypeForCarMaintenance(request.ServiceType);

        var preferredDate = ParsePreferredDate(request.PreferredDate);
        var preferredTime = ParsePreferredTime(request.PreferredTime);
        var appointmentDateTime = preferredDate.ToDateTime(preferredTime);

        var appointment = new Appointment
        {
            CarID = car.CarID,
            AppointmentDate = appointmentDateTime,
            ServiceType = appointmentServiceType,
            RequestedPackageID = appointmentServiceType == "MAINTENANCE" ? request.RequestedPackageId : null,
            Status = "PENDING",
            Notes = BuildNotes(request),
            CreatedBy = userId,
            CreatedDate = DateTime.UtcNow
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync(ct);

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

        _db.CarMaintenances.Add(maintenance);
        await _db.SaveChangesAsync(ct);

        return new RepairRequestDetailDto
        {
            AppointmentId = appointment.AppointmentID,
            CarId = car.CarID,
            CreatedByUserId = userId,
            Title = request.Title,
            Description = request.Description,
            Symptoms = request.Symptoms.ToList(),
            ServiceType = appointmentServiceType,
            RequestedPackageId = appointment.RequestedPackageID,
            TechnicianId = technician?.UserID,
            PreferredDate = request.PreferredDate,
            PreferredTime = request.PreferredTime,
            CreatedDateUtc = appointment.CreatedDate,
            Status = appointment.Status
        };
    }

    /// <summary>
    /// Validates request and returns (Car, Technician?, Package?, AppointmentServiceType).
    /// Throws ArgumentException for business rule violations (400).
    /// </summary>
    private async Task<(Car car, User? technician, MaintenancePackage? package, string appointmentServiceType)> ValidateAndLoadCoreDataAsync(
        RepairRequestCreateRequest request,
        int userId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request.Title));
        if (string.IsNullOrWhiteSpace(request.Description))
            throw new ArgumentException("Description is required.", nameof(request.Description));
        if (string.IsNullOrWhiteSpace(request.ServiceType))
            throw new ArgumentException("ServiceType is required. Use 'repair' or 'maintenance'.", nameof(request.ServiceType));

        var normalizedType = request.ServiceType.Trim().ToLowerInvariant();
        if (normalizedType != "repair" && normalizedType != "maintenance")
            throw new ArgumentException("ServiceType must be 'repair' or 'maintenance'.", nameof(request.ServiceType));

        // REPAIR => RequestedPackageId MUST be null
        if (normalizedType == "repair")
        {
            if (request.RequestedPackageId.HasValue)
                throw new ArgumentException("RequestedPackageId must not be set when ServiceType is 'repair'.", nameof(request.RequestedPackageId));
        }

        // MAINTENANCE => RequestedPackageId required, package must exist and be active
        MaintenancePackage? package = null;
        if (normalizedType == "maintenance")
        {
            if (!request.RequestedPackageId.HasValue)
                throw new ArgumentException("RequestedPackageId is required when ServiceType is 'maintenance'.", nameof(request.RequestedPackageId));

            package = await _db.MaintenancePackages
                .FirstOrDefaultAsync(p => p.PackageID == request.RequestedPackageId.Value && p.IsActive, ct);

            if (package == null)
                throw new ArgumentException("Maintenance package not found or inactive.", nameof(request.RequestedPackageId));
        }

        var car = await _db.Cars
            .FirstOrDefaultAsync(c => c.CarID == request.CarId && c.OwnerID == userId, ct)
            ?? throw new InvalidOperationException("Car not found or does not belong to current user.");

        User? technician = null;
        if (request.TechnicianId.HasValue)
        {
            technician = await _db.Users
                .FirstOrDefaultAsync(u => u.UserID == request.TechnicianId.Value && u.RoleID == 3 && u.IsActive, ct)
                ?? throw new InvalidOperationException("Technician not found or inactive.");
        }

        _ = ParsePreferredDate(request.PreferredDate);
        _ = ParsePreferredTime(request.PreferredTime);

        var appointmentServiceType = normalizedType == "repair" ? "REPAIR" : "MAINTENANCE";
        return (car, technician, package, appointmentServiceType);
    }

    private static (decimal totalCost, int totalMinutes) GetEstimatedCostAndMinutes(string appointmentServiceType, MaintenancePackage? package)
    {
        if (appointmentServiceType == "REPAIR")
            return (0m, 0);

        if (package == null)
            return (0m, 0);

        var cost = package.FinalPrice ?? package.BasePrice;
        var minutes = package.EstimatedDurationHours.HasValue
            ? (int)Math.Round((double)(package.EstimatedDurationHours.Value * 60m))
            : 0;
        return (cost, minutes);
    }

    /// <summary>
    /// Maps request ServiceType to CarMaintenance.MaintenanceType (CK_RO_Type: RESCUE, WARRANTY, REPAIR, REGULAR).
    /// </summary>
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
        var symptoms = request.Symptoms != null && request.Symptoms.Count > 0
            ? string.Join(", ", request.Symptoms)
            : "N/A";
        return $"Title: {request.Title}\nDescription: {request.Description}\nSymptoms: {symptoms}";
    }
}
