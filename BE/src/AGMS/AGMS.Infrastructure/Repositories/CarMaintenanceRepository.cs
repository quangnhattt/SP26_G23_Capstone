using AGMS.Application.Contracts;
using AGMS.Application.DTOs.ServiceOrder;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class CarMaintenanceRepository : ICarMaintenanceRepository
{
    private readonly CarServiceDbContext _db;

    public CarMaintenanceRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ServiceOrderListItemDto>> GetServiceOrdersForStaffAsync(CancellationToken ct = default)
    {
        return await _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car)
                .ThenInclude(c => c.Owner)
            .Include(m => m.AssignedTechnician)
            .Where(m => m.Status != "WAITING")
            .OrderByDescending(m => m.MaintenanceID)
            .Select(m => new ServiceOrderListItemDto
            {
                MaintenanceId = m.MaintenanceID,
                CustomerName = m.Car.Owner.FullName,
                CarInfo = (m.Car.Brand ?? string.Empty) + " - " + (m.Car.LicensePlate ?? string.Empty),
                MaintenanceDate = m.MaintenanceDate,
                CompletedDate = m.CompletedDate,
                MaintenanceType = m.MaintenanceType,
                Status = m.Status,
                TechnicianName = m.AssignedTechnician != null ? m.AssignedTechnician.FullName : null
            })
            .ToListAsync(ct);
    }

    public async Task<MaintenancePrintDto?> GetMaintenancePrintAsync(int maintenanceId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car)
            .Include(m => m.MaintenancePackageUsages).ThenInclude(mpu => mpu.Package)
            .Include(m => m.ServiceDetails).ThenInclude(sd => sd.Product)
            .Include(m => m.ServicePartDetails).ThenInclude(spd => spd.Product).FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
        if (maintenance == null)
        {
            return null;
        }
        var serviceItems = maintenance.ServiceDetails
        .OrderByDescending(sd => sd.FromPackage)
        .ThenBy(sd => sd.ServiceDetailID)
        .Select(sd => new MaintenanceLineItemDto
        {
            SourceType = sd.FromPackage ? "Dich vu tu goi" : "Dich vu le",
            ItemCode = sd.Product.Code,
            ItemName = sd.Product.Name,
            Quantity = sd.Quantity,
            UnitPrice = sd.UnitPrice,
            Notes = sd.Notes,
            ItemStatus = sd.ItemStatus
        });
        var partItems = maintenance.ServicePartDetails
            .OrderBy(spd => spd.ServicePartDetailID)
            .Select(spd => new MaintenanceLineItemDto
            {
                SourceType = spd.FromPackage ? "Phu tung tu goi" : "Phu tung le",
                ItemCode = spd.Product.Code,
                ItemName = spd.Product.Name,
                Quantity = spd.Quantity,
                UnitPrice = spd.UnitPrice,
                Notes = spd.Notes,
                ItemStatus = spd.ItemStatus
            });
        return new MaintenancePrintDto
        {
            MaintenanceId = maintenance.MaintenanceID,
            Brand = maintenance.Car.Brand,
            Model = maintenance.Car.Model,
            Color = maintenance.Car.Color,
            LicensePlate = maintenance.Car.LicensePlate,
            EngineNumber = maintenance.Car.EngineNumber,
            ChassisNumber = maintenance.Car.ChassisNumber,
            Odometer = maintenance.Car.CurrentOdometer,
            Status = maintenance.Status,
            CreatedDate = maintenance.CreatedDate,
            MaintenanceDate = maintenance.MaintenanceDate,
            LineItems = serviceItems.Concat(partItems).ToList()
        };
    }

    public async Task ProposeAdditionalItemsAsync(int maintenanceId, ProposeAdditionalItemsRequest request, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct)
        ?? throw new KeyNotFoundException($"Khoong timf thaasy phieeus Id ={maintenanceId}");
        if (maintenance.Status != "IN_DIAGNOSIS")
            throw new InvalidOperationException("Chi duoc de xuat bo sung khi phieu dang IN_DIAGNOSIS");
        foreach (var item in request.Services)
        {
            var product = await _db.Products
                .Include(p => p.ProductInventory)
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.ProductID == item.ProductId && p.IsActive, ct)
                ?? throw new KeyNotFoundException($"Khoong timf thaasy sanr phaarm Id ={item.ProductId}");

            if (!product.Type.Equals("SERVICE", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException($"Sanr phaarm '{product.Name}' khong phai loaij Service");
            _db.ServiceDetails.Add(new ServiceDetail
            {
                MaintenanceID = maintenanceId,
                ProductID = product.ProductID,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                ItemStatus = "PENDING",
                IsAdditional = true,
                FromPackage = false,
                Notes = item.Notes,
            });
        }

        foreach (var item in request.Parts)
        {
            var product = await _db.Products
                .Include(p => p.ProductInventory)
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.ProductID == item.ProductId && p.IsActive, ct)
                ?? throw new KeyNotFoundException($"Khong tim thay san pham ID ={item.ProductId}");
            if (!product.Type.Equals("PART", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException($"San pham'{product.Name}' khong pahi la kieu PART");
            _db.ServicePartDetails.Add(new ServicePartDetail
            {
                MaintenanceID = maintenanceId,
                ProductID = product.ProductID,
                Quantity = item.Quantity,
                UnitPrice = CalculateAdditionalItemUnitPrice(product),
                ItemStatus = "PENDING",
                InventoryStatus = "PENDING",
                IsAdditional = true,
                FromPackage = false,
                IssuedQuantity = 0,
                Notes = item.Notes
            });
        }

        // Khi technician đề xuất thêm hạng mục, phiếu chuyển sang trạng thái báo giá.
        maintenance.Status = "QUOTED";

        await _db.SaveChangesAsync(ct);
    }

    public async Task<AdditionalItemsDto> GetAdditionalItemsAsync(int maintenanceId, CancellationToken ct = default)
    {
        var exist = await _db.CarMaintenances.AnyAsync(m => m.MaintenanceID == maintenanceId, ct);
        if (!exist)
        {
            throw new KeyNotFoundException($"Khong tim thay phieu Id = {maintenanceId}.");
        }
        var services = await _db.ServiceDetails.AsNoTracking().Include(sd => sd.Product)
            .Where(sd => sd.MaintenanceID == maintenanceId && sd.IsAdditional)
            .Select(sd => new AdditionalServiceItemDto
            {
                ServiceDetailId = sd.ServiceDetailID,
                ItemCode = sd.Product.Code,
                ItemName = sd.Product.Name,
                Quantity = sd.Quantity,
                UnitPrice = sd.UnitPrice,
                Notes = sd.Notes,
                ItemStatus = sd.ItemStatus
            }).ToListAsync(ct);

        var parts = await _db.ServicePartDetails.AsNoTracking().Include(spd => spd.Product)
            .Where(spd => spd.MaintenanceID == maintenanceId && spd.IsAdditional)
            .Select(spd => new AdditionalPartItemDto
            {
                ServicePartDetailId = spd.ServicePartDetailID,
                ItemCode = spd.Product.Code,
                ItemName = spd.Product.Name,
                Quantity = spd.Quantity,
                UnitPrice = spd.UnitPrice,
                Notes = spd.Notes,
                ItemStatus = spd.ItemStatus
            }).ToListAsync(ct);
        return new AdditionalItemsDto { Services = services, Parts = parts };

    }

    public async Task RespondToAdditionalItemsAsync(int maintenanceId, RespondAdditionalItemsRequest request, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct)
            ?? throw new KeyNotFoundException($"Khong tim thay phieu Id= {maintenanceId}");

        if (maintenance.Status != "QUOTED")
            throw new InvalidOperationException("SA chi co the phe duyet khi phieu dang QUOTED.");

        decimal extraAmount = 0;

        foreach (var respond in request.Items)
        {
            var type = respond.Type.Trim().ToUpperInvariant();

            if (type == "SERVICE")
            {
                var item = await _db.ServiceDetails
                    .FirstOrDefaultAsync(sd =>
                        sd.ServiceDetailID == respond.ItemId &&
                        sd.MaintenanceID == maintenanceId &&
                        sd.IsAdditional &&
                        sd.ItemStatus == "PENDING", ct)
                    ?? throw new KeyNotFoundException($"Khong tim thay dich vu bo sung ID = {respond.ItemId} dang o trang thai PENDING.");

                item.ItemStatus = respond.Approved ? "APPROVED" : "REJECTED";

                if (respond.Approved)
                    extraAmount += item.Quantity * item.UnitPrice;
            }
            else if (type == "PART")
            {
                var item = await _db.ServicePartDetails
                    .FirstOrDefaultAsync(spd =>
                        spd.ServicePartDetailID == respond.ItemId &&
                        spd.MaintenanceID == maintenanceId &&
                        spd.IsAdditional &&
                        spd.ItemStatus == "PENDING", ct)
                    ?? throw new KeyNotFoundException($"Khong tim thay phu tung bo sung ID = {respond.ItemId} dang o trang thai PENDING.");

                item.ItemStatus = respond.Approved ? "APPROVED" : "REJECTED";

                if (respond.Approved)
                    extraAmount += item.Quantity * item.UnitPrice;
            }
            else
            {
                throw new ArgumentException($"Type '{respond.Type}' khong hop le. Dung 'SERVICE' hoac 'PART'.");
            }
        }

        maintenance.TotalAmount += extraAmount;

        var stillHasPendingItems =
            await _db.ServiceDetails.AnyAsync(sd =>
                sd.MaintenanceID == maintenanceId &&
                sd.IsAdditional &&
                sd.ItemStatus == "PENDING", ct)
            ||
            await _db.ServicePartDetails.AnyAsync(spd =>
                spd.MaintenanceID == maintenanceId &&
                spd.IsAdditional &&
                spd.ItemStatus == "PENDING", ct);

        // Chỉ quay lại IN_DIAGNOSIS khi tất cả hạng mục đề xuất đã được xử lý xong.
        if (!stillHasPendingItems)
            maintenance.Status = "IN_DIAGNOSIS";

        await _db.SaveChangesAsync(ct);
    }

    private static decimal CalculateAdditionalItemUnitPrice(Product product)
    {
        var averageCost = product.ProductInventory?.AverageCost;
        if (!averageCost.HasValue)
        {
            throw new InvalidOperationException(
                $"ProductID {product.ProductID} has no ProductInventory.AverageCost.");
        }

        var markupPercent = product.Category?.MarkupPercent ?? 0m;
        return averageCost.Value * (1 + (markupPercent / 100m));
    }

}
