using AGMS.Application.Contracts;
using AGMS.Application.DTOs.RepairRequests;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class CarRepository : ICarRepository
{
    private readonly CarServiceDbContext _db;

    public CarRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<Car?> GetByIdAndOwnerAsync(int carId, int ownerId, CancellationToken ct)
    {
        return await _db.Cars.FirstOrDefaultAsync(c => c.CarID == carId && c.OwnerID == ownerId, ct);
    }

    public async Task<Car?> GetByLicensePlateAsync(string licensePlate, CancellationToken ct)
    {
        return await _db.Cars.AsNoTracking().FirstOrDefaultAsync(c => c.LicensePlate == licensePlate, ct);
    }

    public async Task AddAsync(Car car, CancellationToken ct)
    {
        _db.Cars.Add(car);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Car car, CancellationToken ct)
    {
        await _db.SaveChangesAsync(ct);
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
}
