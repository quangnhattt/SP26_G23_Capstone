using AGMS.Application.DTOs.Car;
using AGMS.Application.DTOs.RepairRequests;

namespace AGMS.Application.Contracts;

public interface ICarService
{
    Task<CarDetailDto> AddCarAsync(int userId, CreateCarDto dto, CancellationToken ct);
    Task<CarDetailDto> UpdateCarAsync(int userId, int carId, UpdateCarDto dto, CancellationToken ct);
    Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, string? phone, CancellationToken ct);
}
