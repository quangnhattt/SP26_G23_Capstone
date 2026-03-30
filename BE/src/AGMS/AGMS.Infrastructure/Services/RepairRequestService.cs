using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.RepairRequests;
using AGMS.Application.DTOs.Scheduling;
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
        var customerPhone = await _repo.GetUserPhoneByIdAsync(userId, ct);

        var (totalCost, totalMinutes) = GetEstimatedCostAndMinutes(appointmentServiceType);

        return new RepairRequestPreviewResponse
        {
            EstimatedTotalCost = totalCost,
            EstimatedTotalMinutes = totalMinutes,
            Phone = customerPhone,
            Echo = request
        };
    }

    public async Task<RepairRequestDetailDto> CreateAsync(RepairRequestCreateRequest request, int userId, CancellationToken ct)
    {
        var (car, technician, appointmentServiceType) = await ValidateAndLoadCoreDataAsync(request, userId, ct);
        var customerPhone = await _repo.GetUserPhoneByIdAsync(userId, ct);

        var preferredDate = ParsePreferredDate(request.PreferredDate);
        var preferredTime = ParsePreferredTime(request.PreferredTime);

        // === Validate slot capacity ===
        await ValidateSlotCapacityAsync(preferredDate, preferredTime, request.TechnicianId, ct);

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
            CreatedDate = DateTime.UtcNow,
            AssignedTechnicianID = technician?.UserID
        };

        await _repo.AddAppointmentAsync(appointment, ct);

        // Lưu triệu chứng gắn với appointment (nếu có)
        if (request.SymptomIds != null && request.SymptomIds.Count > 0)
        {
            await _repo.AddAppointmentSymptomsAsync(appointment.AppointmentID, request.SymptomIds, ct);
        }

        return new RepairRequestDetailDto
        {
            AppointmentId = appointment.AppointmentID,
            CarId = car.CarID,
            CreatedByUserId = userId,
            Phone = customerPhone,
            Description = request.Description,
            ServiceType = appointmentServiceType,
            TechnicianId = technician?.UserID,
            PreferredDate = request.PreferredDate,
            PreferredTime = request.PreferredTime,
            CreatedDateUtc = appointment.CreatedDate,
            Status = appointment.Status
        };
    }

    // === Scheduling ===

    public async Task<DayAvailabilityDto> GetAvailableSlotsAsync(string date, CancellationToken ct)
    {
        var parsedDate = ParsePreferredDate(date);
        var techCount = await _repo.CountActiveTechniciansAsync(ct);

        var slots = new List<SlotAvailabilityDto>();

        for (int i = 0; i < SchedulingConfig.SlotStartTimes.Length; i++)
        {
            var slotStart = SchedulingConfig.SlotStartTimes[i];
            var slotEnd = slotStart.AddMinutes(SchedulingConfig.SlotDurationMinutes);
            var bookedCount = await _repo.CountAppointmentsInSlotAsync(parsedDate, slotStart, ct);

            var availableCount = Math.Max(0, techCount - bookedCount);

            slots.Add(new SlotAvailabilityDto
            {
                SlotIndex = i + 1,
                StartTime = slotStart.ToString("HH:mm"),
                EndTime = slotEnd.ToString("HH:mm"),
                BookedCount = bookedCount,
                Capacity = techCount,
                AvailableCount = availableCount,
                IsAvailable = availableCount > 0
            });
        }

        return new DayAvailabilityDto
        {
            Date = parsedDate.ToString("yyyy-MM-dd"),
            TotalTechnicians = techCount,
            Slots = slots
        };
    }

    public async Task<IEnumerable<SlotTechnicianDto>> GetAvailableTechniciansInSlotAsync(string date, string time, CancellationToken ct)
    {
        var parsedDate = ParsePreferredDate(date);
        var parsedTime = ParsePreferredTime(time);

        if (!SchedulingConfig.IsValidSlotStartTime(parsedTime))
            throw new ArgumentException(
                $"Giờ '{time}' không phải khung giờ hợp lệ. Các khung giờ: 08:00, 09:00, ..., 16:00.",
                nameof(time));

        // Lấy tất cả KTV active
        var allTechs = await _repo.GetActiveTechniciansAsync(ct);

        // Lấy danh sách KTV đã bị book trong slot này
        var bookedTechIds = await _repo.GetBookedTechnicianIdsInSlotAsync(parsedDate, parsedTime, ct);
        var bookedSet = new HashSet<int>(bookedTechIds);

        // Trả danh sách KTV, đánh dấu ai rảnh ai bận
        return allTechs.Select(t => new SlotTechnicianDto
        {
            TechnicianId = t.TechnicianId,
            FullName = t.FullName,
            Email = t.Email,
            Phone = t.Phone,
            Skills = t.Skills,
            IsAvailableInSlot = !bookedSet.Contains(t.TechnicianId)
        })
        .OrderByDescending(t => t.IsAvailableInSlot) // Rảnh lên đầu
        .ToList();
    }

    // === Private helpers ===

    /// <summary>
    /// Validate: slot còn chỗ không? KTV (nếu chọn) có bị book chưa?
    /// </summary>
    private async Task ValidateSlotCapacityAsync(DateOnly date, TimeOnly time, int? technicianId, CancellationToken ct)
    {
        if (!SchedulingConfig.IsValidSlotStartTime(time))
            throw new ArgumentException(
                $"Giờ đặt lịch phải là giờ bắt đầu khung giờ hợp lệ (08:00, 09:00, ..., 16:00).");

        // Check tổng slot capacity
        var techCount = await _repo.CountActiveTechniciansAsync(ct);
        var bookedCount = await _repo.CountAppointmentsInSlotAsync(date, time, ct);

        if (bookedCount >= techCount)
            throw new InvalidOperationException(
                $"Khung giờ {time:HH:mm} ngày {date:dd/MM/yyyy} đã đầy ({bookedCount}/{techCount}). " +
                "Vui lòng chọn khung giờ khác.");

        // Check KTV cụ thể (nếu có chọn)
        if (technicianId.HasValue)
        {
            var bookedTechIds = await _repo.GetBookedTechnicianIdsInSlotAsync(date, time, ct);
            if (bookedTechIds.Contains(technicianId.Value))
                throw new InvalidOperationException(
                    $"Kỹ thuật viên này đã có lịch hẹn trong khung giờ {time:HH:mm} ngày {date:dd/MM/yyyy}. " +
                    "Vui lòng chọn kỹ thuật viên khác hoặc khung giờ khác.");
        }
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
