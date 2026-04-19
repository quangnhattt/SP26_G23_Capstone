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

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.Trim().ToUpperInvariant();
            q = q.Where(m => m.Status.ToUpper() == status);
        }

        if (!string.IsNullOrWhiteSpace(query.CustomerName))
        {
            var kw = query.CustomerName.Trim();
            q = q.Where(m => m.Car.Owner.FullName.Contains(kw));
        }

        if (query.CustomerId.HasValue)
        {
            q = q.Where(m => m.Car.OwnerID == query.CustomerId.Value);
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

    public async Task<ServiceOrderPagedResultDto<CustomerServiceHistoryDto>> GetCustomerHistoryAsync(int customerId, string? statusFilter, int page, int pageSize, CancellationToken ct = default)
    {
        page = page <= 0 ? 1 : page;
        pageSize = pageSize <= 0 ? 10 : pageSize;

        var query = _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car)
            .Where(m => m.Car.OwnerID == customerId);

        if (!string.IsNullOrWhiteSpace(statusFilter))
        {
            var st = statusFilter.Trim().ToUpperInvariant();
            query = query.Where(m => m.Status.ToUpper() == st);
        }
        else
        {
            // Mặc định khách hàng chỉ xem Lịch sử đơn đã hoàn thành (CLOSED)
            query = query.Where(m => m.Status.ToUpper() == "CLOSED");
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(m => m.CompletedDate ?? m.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new CustomerServiceHistoryDto
            {
                MaintenanceId = m.MaintenanceID,
                FinishedDate = m.CompletedDate,
                LicensePlate = m.Car.LicensePlate ?? string.Empty,
                MaintenanceType = m.MaintenanceType,
                FinalAmount = m.FinalAmount ?? (m.TotalAmount - m.DiscountAmount - m.MemberDiscountAmount),
                Status = m.Status
            })
            .ToListAsync(ct);

        return new ServiceOrderPagedResultDto<CustomerServiceHistoryDto>
        {
            Items = items,
            TotalCount = totalCount,
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
        var packageItems = maintenance.MaintenancePackageUsages.OrderByDescending(pu => pu.UsageID)
            .Select(pu => new MaintenanceLineItemDto
            {
                SourceType = "Gói bảo dưỡng",
                ItemCode = pu.Package.PackageCode,
                ItemName = pu.Package.Name,
                Quantity = 1,
                UnitPrice = pu.Package.BasePrice,
                Notes = null,
                ItemStatus = "COMPLETED"
            }).ToList();

        var serviceItems = maintenance.ServiceDetails
            .Select(sd => new MaintenanceLineItemDto
            {
                SourceType = sd.FromPackage ? "Dịch vụ từ gói" : "Dịch vụ lẻ",
                ItemCode = sd.Product.Code,
                ItemName = sd.Product.Name,
                Quantity = sd.Quantity,
                UnitPrice = sd.FromPackage ? 0 : sd.UnitPrice,
                Notes = sd.Notes,
                ItemStatus = sd.ItemStatus
            }).ToList();

        var partItems = maintenance.ServicePartDetails
            .Select(spd => new MaintenanceLineItemDto
            {
                SourceType = spd.FromPackage ? "Phụ tùng từ gói" : "Phụ tùng lẻ",
                ItemCode = spd.Product.Code,
                ItemName = spd.Product.Name,
                Quantity = spd.Quantity,
                UnitPrice = spd.FromPackage ? 0 : spd.UnitPrice,
                Notes = spd.Notes,
                ItemStatus = spd.ItemStatus
            }).ToList();

        var allItems = packageItems.Concat(serviceItems).Concat(partItems)
            .OrderBy(x => x.SourceType == "Gói bảo dưỡng" ? 0 :
                          x.SourceType == "Dịch vụ từ gói" ? 1 :
                          x.SourceType == "Phụ tùng từ gói" ? 2 :
                          x.SourceType == "Dịch vụ lẻ" ? 3 : 4)
            .ThenBy(x => x.ItemCode)
            .ToList();

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
            LineItems = allItems
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

        var status = maintenance.Status.ToUpperInvariant();
        if (status != "WAITING_FOR_PAYMENT" && status != "CLOSED")
        {
            throw new InvalidOperationException("Chỉ có thể xem biên lai (Hóa đơn) khi đơn ở trạng thái CHỜ THANH TOÁN (WAITING_FOR_PAYMENT) hoặc ĐÃ ĐÓNG (CLOSED).");
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
            
            PackagePrice=pu.Package.BasePrice,
            PackageDiscountAmount=pu.DiscountAmount
        }).ToList();

        var packageItems = maintenance.MaintenancePackageUsages.OrderByDescending(pu => pu.UsageID)
            .Select(pu => new MaintenanceInvoiceLineItemDto
            {
                SourceType = "Gói bảo dưỡng",
                ItemCode = pu.Package.PackageCode,
                ItemName = pu.Package.Name,
                Quantity = 1,
                UnitPrice = pu.Package.BasePrice,
                TotalPrice = pu.AppliedPrice,
                Notes = null,
                ItemStatus = "COMPLETED"
            }).ToList();

        var serviceItems = maintenance.ServiceDetails
            .OrderByDescending(sd => sd.FromPackage)
            .ThenBy(sd => sd.ServiceDetailID)
            .Select(sd => new MaintenanceInvoiceLineItemDto
            {
                SourceType = sd.FromPackage ? "Dịch vụ từ gói" : "Dịch vụ lẻ",
                ItemCode = sd.Product.Code,
                ItemName = sd.Product.Name,
                Quantity = sd.Quantity,
                UnitPrice = sd.FromPackage ? 0 : sd.UnitPrice,
                TotalPrice = sd.FromPackage ? 0 : (sd.Quantity * sd.UnitPrice),
                Notes = sd.Notes,
                ItemStatus = sd.ItemStatus,
            }).ToList();

        var partItems = maintenance.ServicePartDetails
            .OrderByDescending(spd => spd.FromPackage)
            .ThenBy(spd => spd.ServicePartDetailID)
            .Select(spd => new MaintenanceInvoiceLineItemDto
            {
                SourceType = spd.FromPackage ? "Phụ tùng từ gói" : "Phụ tùng lẻ",
                ItemCode = spd.Product.Code,
                ItemName = spd.Product.Name,
                Quantity = spd.Quantity,
                UnitPrice = spd.FromPackage ? 0 : spd.UnitPrice,
                TotalPrice = spd.FromPackage ? 0 : (spd.Quantity * spd.UnitPrice),
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
            LineItems=packageItems.Concat(serviceItems).Concat(partItems)
                .OrderByDescending(x => x.SourceType == "Gói bảo dưỡng")
                .ThenByDescending(x => x.SourceType.EndsWith("từ gói"))
                .ThenByDescending(x => x.SourceType.StartsWith("Dịch vụ"))
                .ToList()
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

        if (maintenance.Status.ToUpperInvariant() != "COMPLETED")
        {
            throw new InvalidOperationException("Chỉ có thể chốt/Tạo hóa đơn khi đơn sửa chữa đã hoàn tất (COMPLETED).");
        }

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
            
            // CHỐT CỨNG số tiền cuối cùng cần thanh toán xuống DB để tiện làm báo cáo doanh thu
            maintenance.FinalAmount = maintenance.TotalAmount - maintenance.DiscountAmount - memberAmount;
        }

        // ĐổI TRẠNG THÁI: Để FE làm tín hiệu hiển thị nút "Xem Hóa Đơn" / "Thanh Toán"
        if (maintenance.Status.ToUpperInvariant() == "COMPLETED")
        {
            maintenance.Status = "WAITING_FOR_PAYMENT";
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

    public async Task<AdditionalItemsDto> GetAdditionalItemsAsync(int maintenanceId, int currentUserId, int currentRoleId, CancellationToken ct = default)
    {
        var main = await _db.CarMaintenances
            .Include(m => m.Car)
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
            
        if (main == null)
        {
            throw new KeyNotFoundException($"Khong tim thay phieu Id = {maintenanceId}.");
        }

        if (currentRoleId == 4 && main.Car.OwnerID != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin phát sinh của khách hàng khác.");
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
        
        // Lưu kết quả approve/reject và cộng thêm tiền trước
        await _db.SaveChangesAsync(ct);

        // KIỂM TRA PHỤ TRỢ: Xem thử sau cú duyệt vừa rồi, cái bill này còn cái nào dán nhãn PENDING không?
        var hasPendingService = await _db.ServiceDetails
            .AnyAsync(sd => sd.MaintenanceID == maintenanceId && sd.ItemStatus == "PENDING", ct);
        var hasPendingPart = await _db.ServicePartDetails
            .AnyAsync(spd => spd.MaintenanceID == maintenanceId && spd.ItemStatus == "PENDING", ct);

        // Nếu sạch bóng bóng PENDING (Khách đã confirm HẾT SẠCH) -> Tự động nhảy số sang IN_PROGRESS luôn!
        if (!hasPendingService && !hasPendingPart)
        {
            maintenance.Status = "IN_PROGRESS";
            
            _db.MaintenanceStatusLogs.Add(new MaintenanceStatusLog
            {
                MaintenanceID = maintenanceId,
                OldStatus = "QUOTED",
                NewStatus = "IN_PROGRESS",
                // Vì API này đang chưa có claim UserId nên có thể để null hoặc ko bắt buộc
                ChangedDate = DateTime.UtcNow,
                Note = "Hệ thống tự động chuyển đổi do tất cả phát sinh đã được Khách Hàng phản hồi xong."
            });

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

    public async Task<bool> ConfirmRepairOrderAsync(int maintenanceId, int updatedByUserId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
        if (maintenance == null) return false;

        // Cho phép xác nhận từ IN_DIAGNOSIS (không phát sinh) hoặc QUOTED (có phát sinh đã duyệt)
        var currentStatus = maintenance.Status.ToUpperInvariant();
        if (currentStatus != "IN_DIAGNOSIS" && currentStatus != "QUOTED")
        {
            throw new InvalidOperationException("Chỉ có thể xác nhận sửa chữa khi đơn đang ở trạng thái chẩn đoán (IN_DIAGNOSIS) hoặc đã báo giá (QUOTED).");
        }

        // Nếu là QUOTED, phải đảm bảo tất cả hạng mục phát sinh đã được xử lý (APPROVED hoặc REJECTED)
        if (currentStatus == "QUOTED")
        {
            var hasPendingService = await _db.ServiceDetails
                .AnyAsync(sd => sd.MaintenanceID == maintenanceId && sd.ItemStatus == "PENDING", ct);
            var hasPendingPart = await _db.ServicePartDetails
                .AnyAsync(spd => spd.MaintenanceID == maintenanceId && spd.ItemStatus == "PENDING", ct);

            if (hasPendingService || hasPendingPart)
            {
                throw new InvalidOperationException("Khách hàng chưa duyệt điều kiện phát sinh.");
            }
        }

        var now = DateTime.UtcNow;
        var oldStatus = maintenance.Status;

        maintenance.Status = "IN_PROGRESS";
        
        _db.MaintenanceStatusLogs.Add(new MaintenanceStatusLog
        {
            MaintenanceID = maintenanceId,
            OldStatus = oldStatus,
            NewStatus = "IN_PROGRESS",
            ChangedBy = updatedByUserId,
            ChangedDate = now,
            Note = "Cố vấn dịch vụ xác nhận bắt đầu sửa chữa chính thức."
        });

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> FinishRepairOrderAsync(int maintenanceId, int updatedByUserId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .Include(m => m.ServicePartDetails) // Dùng để kiểm tra tồn kho vật tư
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
            
        if (maintenance == null) return false;

        // Bắt buộc phải đang sửa
        if (maintenance.Status.ToUpperInvariant() != "IN_PROGRESS")
            throw new InvalidOperationException("Chỉ có thể báo cáo hoàn tất khi xe đang ở trạng thái sửa chữa (IN_PROGRESS).");

        // 1. Chốt chặn: Kiểm tra đúng là thợ được giao không
        var user = await _db.Users.FindAsync(new object[] { updatedByUserId }, ct);
        if (user != null && user.RoleID == 3) // Nếu người gọi API đích thị là Kỹ thuật viên (Role 3)
        {
            if (maintenance.AssignedTechnicianID != updatedByUserId)
            {
                throw new InvalidOperationException("Thao tác bị từ chối: Chỉ kỹ thuật viên được phân công cho xe này mới có quyền bấm Hoàn tất.");
            }
        }

        // 2. Chốt chặn: Phụ tùng (nếu có được duyệt) bắt buộc phải xuất ra khỏi kho
        var unissuedApprovedParts = maintenance.ServicePartDetails
            .Where(spd => spd.ItemStatus == "APPROVED" && spd.InventoryStatus != "ISSUED")
            .ToList();

        if (unissuedApprovedParts.Any())
        {
            // Báo lỗi chặn lại
            throw new InvalidOperationException("Không thể hoàn tất sửa chữa: Phụ tùng đã được duyệt nhưng chưa xuất kho. Vui lòng liên hệ SA/Kho.");
        }

        var now = DateTime.UtcNow;
        var oldStatus = maintenance.Status;
        
        maintenance.Status = "COMPLETED";

        _db.MaintenanceStatusLogs.Add(new MaintenanceStatusLog
        {
            MaintenanceID = maintenanceId,
            OldStatus = oldStatus,
            NewStatus = "COMPLETED",
            ChangedBy = updatedByUserId,
            ChangedDate = now,
            Note = "Kỹ thuật viên xác nhận hoàn tất sửa chữa."
        });

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<PartsExportListDto?> GetPartsToExportAsync(int maintenanceId, CancellationToken ct = default)
    {
        var maintenance = await _db.CarMaintenances
            .AsNoTracking()
            .Include(m => m.Car).ThenInclude(c => c.Owner)
            .Include(m => m.ServicePartDetails).ThenInclude(spd => spd.Product).ThenInclude(p => p.Unit)
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);

        if (maintenance == null) return null;

        var exportList = new PartsExportListDto
        {
            MaintenanceID = maintenanceId,
            CustomerName = maintenance.Car.Owner.FullName,
            LicensePlate = maintenance.Car.LicensePlate ?? string.Empty,
            Model = maintenance.Car.Model ?? string.Empty,
            Items = maintenance.ServicePartDetails
                .Where(spd => spd.ItemStatus == "APPROVED" && spd.InventoryStatus == "PENDING")
                .Select(spd => new PartsExportItemDto
                {
                    ProductID = spd.ProductID,
                    ProductCode = spd.Product.Code,
                    ProductName = spd.Product.Name,
                    Quantity = spd.Quantity,
                    UnitName = spd.Product.Unit?.Name ?? "Cái",
                    ItemStatus = spd.ItemStatus,
                    InventoryStatus = spd.InventoryStatus,
                    Notes = spd.Notes,
                    FromPackage = spd.FromPackage
                }).ToList()
        };

        return exportList;
    }

    public async Task<bool> ProcessPaymentAsync(int maintenanceId, ProcessPaymentRequestDto request, int processedByUserId, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var maintenance = await _db.CarMaintenances
                .Include(m => m.Car).ThenInclude(c => c.Owner)
                .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);

            if (maintenance == null) return false;

            if (maintenance.Status.ToUpperInvariant() != "WAITING_FOR_PAYMENT")
                throw new InvalidOperationException("Chỉ có thể thanh toán khi phiếu sửa chữa đã chốt hóa đơn và đang chờ thanh toán (WAITING_FOR_PAYMENT).");

            var amountToPay = maintenance.FinalAmount ?? (maintenance.TotalAmount - maintenance.DiscountAmount - maintenance.MemberDiscountAmount);

            // 1. Ghi nhận giao dịch thanh toán
            _db.PaymentTransactions.Add(new PaymentTransaction
            {
                MaintenanceID = maintenanceId,
                PaymentMethod = request.PaymentMethod,
                Amount = amountToPay,
                PaymentDate = DateTime.UtcNow,
                Status = "SUCCESS",
                TransactionReference = request.TransactionReference,
                Notes = request.Notes,
                ProcessedBy = processedByUserId
            });

            // 2. Chuyển trạng thái Maintenance sang CLOSED
            var oldStatus = maintenance.Status;
            maintenance.Status = "CLOSED";
            
            _db.MaintenanceStatusLogs.Add(new MaintenanceStatusLog
            {
                MaintenanceID = maintenanceId,
                OldStatus = oldStatus,
                NewStatus = "CLOSED",
                ChangedBy = processedByUserId,
                ChangedDate = DateTime.UtcNow,
                Note = $"Thanh toán thành công qua {request.PaymentMethod} và đóng phiếu."
            });

            // 3. Tích lũy điểm & Cập nhật thứ hạng thành viên
            var owner = maintenance.Car?.Owner;
            if (owner != null)
            {
                owner.TotalSpending += amountToPay;

                var newRank = await _db.MembershipRanks
                    .Where(r => r.IsActive && r.MinSpending <= owner.TotalSpending)
                    .OrderByDescending(r => r.MinSpending)
                    .FirstOrDefaultAsync(ct);

                if (newRank != null && owner.CurrentRankID != newRank.RankID)
                {
                    owner.CurrentRankID = newRank.RankID;
                }
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return true;
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
