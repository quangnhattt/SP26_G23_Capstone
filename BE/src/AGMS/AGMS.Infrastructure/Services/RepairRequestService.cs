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

        // Maintenance-by-km recommendation logic (best-effort, non-breaking)
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
                    // Pick packages whose KilometerMilestone is closest to current odometer
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
        // Currently we don't have a strong mapping between services and technicians.
        // For now, we return all active technicians (RoleID == 3).
        // TODO: When skill/service mapping is available, filter technicians by selected services.

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
        // Reuse the same validation and costing logic as CreateAsync, but without saving.
        var (services, _, _) = await ValidateAndLoadCoreDataAsync(request, userId, ct);

        var (totalCost, totalMinutes) = CalculateTotals(services);

        return new RepairRequestPreviewResponse
        {
            EstimatedTotalCost = totalCost,
            EstimatedTotalMinutes = totalMinutes,
            Echo = request
        };
    }

    public async Task<RepairRequestDetailDto> CreateAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct)
    {
        var (services, car, technician) = await ValidateAndLoadCoreDataAsync(request, userId, ct);
        var (totalCost, _) = CalculateTotals(services);

        // Map incoming serviceType (UI) to MaintenanceType (DB) and validate
        var maintenanceType = MapMaintenanceType(request.ServiceType);

        var preferredDate = ParsePreferredDate(request.PreferredDate);
        var preferredTime = ParsePreferredTime(request.PreferredTime);
        var appointmentDateTime = preferredDate.ToDateTime(preferredTime);

        // Create Appointment
        var appointment = new Appointment
        {
            CarID = car.CarID,
            AppointmentDate = appointmentDateTime,
            RequestedPackageID = null,
            Status = "PENDING",
            Notes = BuildNotes(request),
            CreatedBy = userId,
            CreatedDate = DateTime.UtcNow
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync(ct);

        // Create AppointmentServiceItems for selected services
        foreach (var svc in services)
        {
            var item = new AppointmentServiceItem
            {
                AppointmentID = appointment.AppointmentID,
                ProductID = svc.ProductID,
                Quantity = 1m
            };
            _db.AppointmentServiceItems.Add(item);
        }

        // Create initial CarMaintenance record to track technician assignment
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
            ServiceIds = services.Select(s => s.ProductID).ToList(),
            TechnicianId = technician?.UserID,
            PreferredDate = request.PreferredDate,
            PreferredTime = request.PreferredTime,
            CreatedDateUtc = appointment.CreatedDate,
            Status = appointment.Status
        };
    }

    private async Task<(List<Product> services, Car car, User? technician)> ValidateAndLoadCoreDataAsync(
        RepairRequestCreateRequest request,
        int userId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ArgumentException("Title is required.", nameof(request.Title));
        }
        if (string.IsNullOrWhiteSpace(request.Description))
        {
            throw new ArgumentException("Description is required.", nameof(request.Description));
        }
        if (request.ServiceIds == null || request.ServiceIds.Count == 0)
        {
            throw new ArgumentException("At least one service must be selected.", nameof(request.ServiceIds));
        }

        // Validate and normalize serviceType (if provided) but do not change Preview logic:
        // this will still only validate input and throw on invalid values.
        _ = MapMaintenanceType(request.ServiceType);

        // Validate car belongs to current user
        var car = await _db.Cars
            .FirstOrDefaultAsync(c => c.CarID == request.CarId && c.OwnerID == userId, ct)
            ?? throw new InvalidOperationException("Car not found or does not belong to current user.");

        // Load services
        var distinctServiceIds = request.ServiceIds.Distinct().ToList();
        var services = await _db.Products
            .Where(p => distinctServiceIds.Contains(p.ProductID) && (p.Type == "SERVICE" || p.Type == "Service") && p.IsActive)
            .ToListAsync(ct);

        if (services.Count != distinctServiceIds.Count)
        {
            throw new InvalidOperationException("One or more selected services are invalid or inactive.");
        }

        // Validate technician if provided
        User? technician = null;
        if (request.TechnicianId.HasValue)
        {
            technician = await _db.Users
                .FirstOrDefaultAsync(u => u.UserID == request.TechnicianId.Value && u.RoleID == 3 && u.IsActive, ct)
                ?? throw new InvalidOperationException("Technician not found or inactive.");
        }

        // Validate date/time parsing (will throw ArgumentException if invalid)
        _ = ParsePreferredDate(request.PreferredDate);
        _ = ParsePreferredTime(request.PreferredTime);

        return (services, car, technician);
    }

    private static (decimal totalCost, int totalMinutes) CalculateTotals(IEnumerable<Product> services)
    {
        decimal totalCost = 0m;
        var totalMinutes = 0;

        foreach (var svc in services)
        {
            totalCost += svc.Price;

            if (svc.EstimatedDurationHours.HasValue)
            {
                var minutes = (int)Math.Round((double)(svc.EstimatedDurationHours.Value * 60m));
                totalMinutes += minutes;
            }
        }

        return (totalCost, totalMinutes);
    }

    private static string MapMaintenanceType(string? serviceType)
    {
        if (string.IsNullOrWhiteSpace(serviceType))
        {
            // Default behavior: treat missing serviceType as normal regular maintenance/repair
            return "REGULAR";
        }

        var normalized = serviceType.Trim().ToLowerInvariant();

        return normalized switch
        {
            "maintenance" => "REGULAR",
            "repair" => "REPAIR",
            "rescue" => "RESCUE",
            "warranty" => "WARRANTY",
            _ => throw new ArgumentException(
                "serviceType must be one of: maintenance, repair, rescue, warranty.",
                nameof(serviceType))
        };
    }

    private static DateOnly ParsePreferredDate(string date)
    {
        if (!DateOnly.TryParse(date, out var result))
        {
            throw new ArgumentException("PreferredDate must be a valid date in format yyyy-MM-dd.", nameof(date));
        }

        return result;
    }

    private static TimeOnly ParsePreferredTime(string time)
    {
        if (!TimeOnly.TryParse(time, out var result))
        {
            throw new ArgumentException("PreferredTime must be a valid time in format HH:mm.", nameof(time));
        }

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

