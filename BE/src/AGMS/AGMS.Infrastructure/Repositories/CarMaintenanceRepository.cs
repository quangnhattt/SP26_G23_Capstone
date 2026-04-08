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

    public async Task<ServiceOrderPagedResultDto<ServiceOrderListItemDto>> GetServiceOrdersForStaffAsync(ServiceOrderListQueryDto query, int? employeeId = null, CancellationToken ct = default)
    {
        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(100, query.PageSize);

        var q = _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car).ThenInclude(c => c.Owner)
            .Include(m => m.AssignedTechnician)
            .Where(m => m.Status != "RECEIVED")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.MaintenanceType))
        {
            var mt = query.MaintenanceType.Trim().ToUpperInvariant();
            q = q.Where(m => m.MaintenanceType.ToUpper() == mt);
        }

        if (!string.IsNullOrWhiteSpace(query.CustomerName))
        {
            var kw = query.CustomerName.Trim();
            q = q.Where(m => m.Car.Owner.FullName.Contains(kw));
        }

        if (employeeId.HasValue)
        {
            q = q.Where(m => m.AssignedTechnicianID == employeeId.Value);
        }

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderByDescending(m => m.MaintenanceID)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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

        return new ServiceOrderPagedResultDto<ServiceOrderListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<MaintenancePrintDto?> GetMaintenancePrintAsync(int maintenanceId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car).ThenInclude(c => c.Owner)
            .Include(m => m.AssignedTechnician)
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
            TechnicianFullName = maintenance.AssignedTechnician?.FullName,
            TechnicianPhone = maintenance.AssignedTechnician?.Phone,
            TechnicianEmail = maintenance.AssignedTechnician?.Email,
            LineItems = serviceItems.Concat(partItems).ToList()
        };
    }
    public async Task<MaintenanceInvoiceDto?> GetMaintenanceInvoiceAsync(int maintenanceId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car).ThenInclude(c => c.Owner).ThenInclude(o => o.CurrentRank)
            .Include(m => m.MaintenancePackageUsages).ThenInclude(mpu => mpu.Package)
            .Include(m => m.ServiceDetails).ThenInclude(sd => sd.Product)
            .Include(m => m.ServicePartDetails).ThenInclude(spd => spd.Product)
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
        if(maintenance == null)
        {
            return null;
        }
        var owner = maintenance.Car.Owner;
        var baseAmount = maintenance.TotalAmount;

        // Ưu tiên "freeze" membership đã được lưu tại thời điểm tạo hóa đơn.
        var hasFrozenMembership = !string.IsNullOrWhiteSpace(maintenance.RankAtTimeOfService)
                                   || maintenance.MemberDiscountPercent != 0m
                                   || maintenance.MemberDiscountAmount != 0m;

        decimal memberPercent;
        decimal memberAmount;
        string? rankApplied;

        if (hasFrozenMembership)
        {
            memberPercent = maintenance.MemberDiscountPercent;
            memberAmount = maintenance.MemberDiscountAmount;
            rankApplied = maintenance.RankAtTimeOfService;
        }
        else
        {
            // Fallback cho dữ liệu cũ: nếu chưa tạo hóa đơn thì tính theo current rank.
            var rank = owner.CurrentRank;
            memberPercent = rank?.DiscountPercent ?? 0m;
            memberAmount = Math.Round(baseAmount * memberPercent / 100m, 2);
            rankApplied = rank?.RankName;
        }

        var finalAmount = maintenance.FinalAmount ?? (baseAmount - maintenance.DiscountAmount - memberAmount);
        var packageUsages=maintenance.MaintenancePackageUsages.OrderByDescending(x=>x.UsageID).Select(pu=> new MaintenancePackageUsagePrintDto
        {
            PackageId=pu.PackageID,
            PackageCode=pu.Package.PackageCode,
            PackageName=pu.Package.Name,
            PackagePrice=pu.AppliedPrice,
            PackageDiscountAmount=pu.DiscountAmount
        }).ToList();

        var serviceItems = maintenance.ServiceDetails.OrderByDescending(sd => sd.FromPackage).ThenBy(sd => sd.ServiceDetailID)
            .Select(sd => new MaintenanceInvoiceLineItemDto
            {
                SourceType = sd.FromPackage ? "Dich vu tu goi" : "Dich vu le",
                ItemCode = sd.Product.Code,
                ItemName = sd.Product.Name,
                Quantity = sd.Quantity,
                UnitPrice = sd.UnitPrice,
                TotalPrice = sd.Quantity * sd.UnitPrice,
                Notes = sd.Notes,
                ItemStatus = sd.ItemStatus,
            }).ToList();

        var partItems = maintenance.ServicePartDetails.OrderByDescending(spd => spd.ServicePartDetailID)
            .Select(spd => new MaintenanceInvoiceLineItemDto
            {
                SourceType = spd.FromPackage ? "Phu tung tu goi" : "Phu tung le",
                ItemCode = spd.Product.Code,
                ItemName = spd.Product.Name,
                Quantity = spd.Quantity,
                UnitPrice = spd.UnitPrice,
                TotalPrice = spd.Quantity * spd.UnitPrice,
                Notes = spd.Notes,
                ItemStatus = spd.ItemStatus,
            }).ToList();
        return new MaintenanceInvoiceDto
        {
            MaintenanceId = maintenance.MaintenanceID,
            Customer = new MaintenanceCustomerDto
            {
                UserCode = owner.UserCode,
                FullName = owner.FullName,
                Email=owner.Email,
                Phone=owner.Phone,
                Gender=owner.Gender,
                Dob=owner.DateOfBirth,
                CurrentRankId=owner.CurrentRankID,
                TotalSpending=owner.TotalSpending,
            },
            Brand=maintenance.Car.Brand,
            Model=maintenance.Car.Model,    
            Color=maintenance.Car.Color,
            LicensePlate=maintenance.Car.LicensePlate,  
            EngineNumber=maintenance.Car.EngineNumber,
            ChassisNumber=maintenance.Car.ChassisNumber,
            Odometer=maintenance.Car.CurrentOdometer,
            Status=maintenance.Status,
            CreatedDate=maintenance.CreatedDate,
            MaintenanceDate=maintenance.MaintenanceDate,
            TotalAmount=maintenance.TotalAmount,    
            MembershipRankApplied=rankApplied,
            MemberDiscountPercent=memberPercent,
            MemberDiscountAmount=memberAmount,
            FinalAmount=finalAmount,
            PackageUsages=packageUsages,
            LineItems=serviceItems.Concat(partItems).ToList()
        };

    }

    public async Task<MaintenanceInvoiceDto?> CreateMaintenanceInvoiceAsync(int maintenanceId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .Include(m => m.Car).ThenInclude(c => c.Owner).ThenInclude(o => o.CurrentRank)
            .Include(m => m.MaintenancePackageUsages).ThenInclude(mpu => mpu.Package)
            .Include(m => m.ServiceDetails).ThenInclude(sd => sd.Product)
            .Include(m => m.ServicePartDetails).ThenInclude(spd => spd.Product)
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);

        if (maintenance == null)
            return null;

        var hasFrozenMembership = !string.IsNullOrWhiteSpace(maintenance.RankAtTimeOfService)
                                   || maintenance.MemberDiscountPercent != 0m
                                   || maintenance.MemberDiscountAmount != 0m;

        if (!hasFrozenMembership)
        {
            var owner = maintenance.Car.Owner;
            var rank = owner.CurrentRank;

            var memberPercent = rank?.DiscountPercent ?? 0m;
            var memberAmount = Math.Round(maintenance.TotalAmount * memberPercent / 100m, 2);

            maintenance.MemberDiscountPercent = memberPercent;
            maintenance.MemberDiscountAmount = memberAmount;
            maintenance.RankAtTimeOfService = rank?.RankName;
        }

        await _db.SaveChangesAsync(ct);

        // Trả lại invoice dựa trên dữ liệu đã freeze.
        return await GetMaintenanceInvoiceAsync(maintenanceId, ct);
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
        // Lưu trước để Database cập nhật trạng thái ItemStatus mới, AnyAsync bên dưới mới chính xác.
        await _db.SaveChangesAsync(ct);

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

        // Chỉ tiếp tục (IN_PROGRESS) khi tất cả hạng mục đề xuất bổ sung đã được xử lý xong.
        if (!stillHasPendingItems)
        {
            maintenance.Status = "IN_PROGRESS";
            await _db.SaveChangesAsync(ct);
        }
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
    public async Task<bool> AssignTechnicianAsync(int maintenanceId, int technicianId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
        if (maintenance == null) return false;

        var tech = await _db.Users
            .FirstOrDefaultAsync(u => u.UserID == technicianId && u.RoleID == 3 && u.IsActive, ct);
        if (tech == null)
            throw new KeyNotFoundException("Kỹ thuật viên không tồn tại hoặc không hoạt động.");

        if (!string.Equals(maintenance.Status, "WAITING", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Chỉ có thể phân công kỹ thuật viên khi phiếu đang ở trạng thái 'WAITING'.");

        maintenance.AssignedTechnicianID = technicianId;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> StartDiagnosisAsync(int maintenanceId, int updatedByUserId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
        if (maintenance == null) return false;

        if (!string.Equals(maintenance.Status, "WAITING", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Chỉ có thể bắt đầu chẩn đoán cho xe đang ở trạng thái 'WAITING'.");

        if (!maintenance.AssignedTechnicianID.HasValue)
            throw new InvalidOperationException("Đơn này chưa có kĩ thuật viên không thể chuyển trạng thái.");

        var now = DateTime.UtcNow;
        var oldStatus = maintenance.Status;

        maintenance.Status = "IN_DIAGNOSIS";
        maintenance.MaintenanceDate = now;

        _db.MaintenanceStatusLogs.Add(new MaintenanceStatusLog
        {
            MaintenanceID = maintenanceId,
            OldStatus = oldStatus,
            NewStatus = "IN_DIAGNOSIS",
            ChangedBy = updatedByUserId,
            ChangedDate = now,
            Note = "Bắt đầu chẩn đoán."
        });

        await _db.SaveChangesAsync(ct);
        return true;
    }
}
