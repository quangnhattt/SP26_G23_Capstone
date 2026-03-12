using AGMS.Application.DTOs.RepairRequests;
using AGMS.Domain.Entities;

namespace AGMS.Application.Contracts;

public interface ICarRepository
{
    // Lấy xe theo ID + OwnerID (validate ownership)
    Task<Car?> GetByIdAndOwnerAsync(int carId, int ownerId, CancellationToken ct);

    // Check trùng biển số
    Task<Car?> GetByLicensePlateAsync(string licensePlate, CancellationToken ct);

    // Thêm xe mới
    Task AddAsync(Car car, CancellationToken ct);

    // Cập nhật xe
    Task UpdateAsync(Car car, CancellationToken ct);

    // Lấy danh sách xe của customer
    Task<IEnumerable<CustomerCarListItemDto>> GetCustomerCarsAsync(int userId, CancellationToken ct);
}
