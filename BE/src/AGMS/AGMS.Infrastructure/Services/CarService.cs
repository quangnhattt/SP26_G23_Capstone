using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Car;
using AGMS.Application.DTOs.RepairRequests;
using AGMS.Domain.Entities;

namespace AGMS.Infrastructure.Services;

public class CarService : ICarService
{
    private readonly ICarRepository _repo;

    public CarService(ICarRepository repo)
    {
        _repo = repo;
    }

    public async Task<CarDetailDto> AddCarAsync(int userId, CreateCarDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.LicensePlate))
            throw new ArgumentException("Biển số xe là bắt buộc.");
        if (string.IsNullOrWhiteSpace(dto.Brand))
            throw new ArgumentException("Hãng xe là bắt buộc.");
        if (string.IsNullOrWhiteSpace(dto.Model))
            throw new ArgumentException("Dòng xe là bắt buộc.");
        if (dto.Year <= 0)
            throw new ArgumentException("Năm sản xuất không hợp lệ.");

        // Check trùng biển số
        var existing = await _repo.GetByLicensePlateAsync(dto.LicensePlate.Trim(), ct);
        if (existing != null)
            throw new InvalidOperationException("Biển số xe đã tồn tại trong hệ thống.");

        var car = new Car
        {
            LicensePlate = dto.LicensePlate.Trim(),
            Brand = dto.Brand.Trim(),
            Model = dto.Model.Trim(),
            Year = dto.Year,
            Color = dto.Color?.Trim(),
            EngineNumber = dto.EngineNumber?.Trim(),
            ChassisNumber = dto.ChassisNumber?.Trim(),
            PurchaseDate = dto.PurchaseDate,
            CurrentOdometer = dto.CurrentOdometer,
            OwnerID = userId,
            CreatedDate = DateTime.UtcNow
        };

        await _repo.AddAsync(car, ct);
        return MapToDetail(car);
    }

    public async Task<CarDetailDto> UpdateCarAsync(int userId, int carId, UpdateCarDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Brand))
            throw new ArgumentException("Hãng xe là bắt buộc.");
        if (string.IsNullOrWhiteSpace(dto.Model))
            throw new ArgumentException("Dòng xe là bắt buộc.");
        if (dto.Year <= 0)
            throw new ArgumentException("Năm sản xuất không hợp lệ.");

        var car = await _repo.GetByIdAndOwnerAsync(carId, userId, ct)
            ?? throw new InvalidOperationException("Xe không tồn tại hoặc không thuộc về bạn.");

        car.Brand = dto.Brand.Trim();
        car.Model = dto.Model.Trim();
        car.Year = dto.Year;
        car.Color = dto.Color?.Trim();
        car.EngineNumber = dto.EngineNumber?.Trim();
        car.ChassisNumber = dto.ChassisNumber?.Trim();
        car.PurchaseDate = dto.PurchaseDate;
        car.CurrentOdometer = dto.CurrentOdometer;

        await _repo.UpdateAsync(car, ct);
        return MapToDetail(car);
    }

    public async Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, CancellationToken ct)
    {
        return await _repo.GetCustomerCarsAsync(userId, ct);
    }

    private static CarDetailDto MapToDetail(Car car)
    {
        return new CarDetailDto
        {
            CarId = car.CarID,
            LicensePlate = car.LicensePlate,
            Brand = car.Brand,
            Model = car.Model,
            Year = car.Year,
            Color = car.Color,
            EngineNumber = car.EngineNumber,
            ChassisNumber = car.ChassisNumber,
            OwnerID = car.OwnerID,
            PurchaseDate = car.PurchaseDate,
            LastMaintenanceDate = car.LastMaintenanceDate,
            NextMaintenanceDate = car.NextMaintenanceDate,
            CurrentOdometer = car.CurrentOdometer,
            CreatedDate = car.CreatedDate
        };
    }
}
