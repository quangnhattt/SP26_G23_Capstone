using AGMS.Application.Constants;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Rescue;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class RescueRequestRepository : IRescueRequestRepository
{
    private readonly CarServiceDbContext _db;

    public RescueRequestRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Lấy yêu cầu cứu hộ kèm đầy đủ navigation properties để map sang DTO chi tiết
    /// </summary>
    public async Task<RescueRequest?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _db.RescueRequests
            .AsNoTracking()
            .Include(r => r.Customer).ThenInclude(c => c.CurrentRank)
            .Include(r => r.Car)
            .Include(r => r.ServiceAdvisor)
            .Include(r => r.AssignedTechnician)
            .FirstOrDefaultAsync(r => r.RescueID == id, ct);
    }

    /// <summary>
    /// Lấy danh sách yêu cầu cứu hộ theo bộ lọc.
    /// Dùng projection (Select) trực tiếp sang DTO để tối ưu — không cần Include.
    /// </summary>
    public async Task<IEnumerable<RescueRequestListItemDto>> GetListAsync(
        string? status, string? rescueType, int? customerId,
        DateTime? fromDate, DateTime? toDate, CancellationToken ct)
    {
        var query = _db.RescueRequests.AsNoTracking().AsQueryable();

        // Lọc theo trạng thái (hỗ trợ nhiều trạng thái phân cách bằng dấu phẩy, ví dụ: "PENDING,REVIEWING")
        if (!string.IsNullOrWhiteSpace(status))
        {
            var statuses = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            query = query.Where(r => statuses.Contains(r.Status));
        }

        // Lọc theo loại cứu hộ
        if (!string.IsNullOrWhiteSpace(rescueType))
            query = query.Where(r => r.RescueType == rescueType.ToUpperInvariant());

        // Lọc theo khách hàng — cho phép customer chỉ xem rescue của mình
        if (customerId.HasValue)
            query = query.Where(r => r.CustomerID == customerId.Value);

        // Lọc theo khoảng thời gian
        if (fromDate.HasValue)
            query = query.Where(r => r.CreatedDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(r => r.CreatedDate <= toDate.Value);

        return await query
            .OrderByDescending(r => r.CreatedDate)
            .Select(r => new RescueRequestListItemDto
            {
                RescueId           = r.RescueID,
                Status             = r.Status,
                RescueType         = r.RescueType,
                CurrentAddress     = r.CurrentAddress,
                ProblemDescription = r.ProblemDescription,
                CustomerId         = r.CustomerID,
                CustomerName       = r.Customer.FullName,
                CustomerPhone      = r.Customer.Phone,
                CarId              = r.CarID,
                LicensePlate       = r.Car.LicensePlate,
                Brand              = r.Car.Brand,
                Model              = r.Car.Model,
                ServiceAdvisorId   = r.ServiceAdvisorID,
                ServiceAdvisorName = r.ServiceAdvisor != null ? r.ServiceAdvisor.FullName : null,
                CreatedDate        = r.CreatedDate
            })
            .ToListAsync(ct);
    }

    /// <summary>Tạo mới yêu cầu cứu hộ</summary>
    public async Task AddAsync(RescueRequest entity, CancellationToken ct)
    {
        _db.RescueRequests.Add(entity);
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Cập nhật các trường thay đổi theo workflow — fetch tracked entity rồi gán tường minh
    /// để tránh ghi đè các trường không liên quan (pattern nhất quán với UserRepository)
    /// </summary>
    public async Task UpdateAsync(RescueRequest rescue, CancellationToken ct)
    {
        var entity = await _db.RescueRequests
            .FirstOrDefaultAsync(r => r.RescueID == rescue.RescueID, ct);
        if (entity == null) return;

        // Chỉ cập nhật các trường có thể thay đổi theo workflow (không cập nhật CarID, CustomerID, địa chỉ)
        entity.Status                   = rescue.Status;
        entity.RescueType               = rescue.RescueType;
        entity.ServiceAdvisorID         = rescue.ServiceAdvisorID;
        entity.ServiceFee               = rescue.ServiceFee;
        entity.EstimatedArrivalDateTime = rescue.EstimatedArrivalDateTime;
        entity.AssignedTechnicianID     = rescue.AssignedTechnicianID;
        entity.ResultingMaintenanceID   = rescue.ResultingMaintenanceID;
        entity.CompletedDate            = rescue.CompletedDate;

        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Lấy danh sách kỹ thuật viên đang rảnh (BR-28).
    /// Dùng projection để kèm ActiveJobCount mà không cần load toàn bộ entity.
    /// </summary>
    public async Task<IEnumerable<AvailableTechnicianDto>> GetAvailableTechniciansAsync(CancellationToken ct)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => u.RoleID == UserRole.Technician
                     && u.IsActive
                     && !u.IsOnRescueMission)
            .OrderBy(u => u.FullName)
            .Select(u => new AvailableTechnicianDto
            {
                UserId            = u.UserID,
                FullName          = u.FullName,
                Phone             = u.Phone,
                Skills            = u.Skills,
                IsOnRescueMission = u.IsOnRescueMission,
                // Đếm số Repair Order đang xử lý của kỹ thuật viên
                ActiveJobCount    = u.CarMaintenanceAssignedTechnicians
                                     .Count(cm => cm.Status != "COMPLETED" && cm.Status != "CANCELLED")
            })
            .ToListAsync(ct);
    }

    /// <summary>Lấy thông tin xe để validate khi tạo yêu cầu cứu hộ</summary>
    public async Task<Car?> GetCarByIdAsync(int carId, CancellationToken ct)
    {
        return await _db.Cars
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CarID == carId, ct);
    }

    // -------------------------------------------------------------------------
    // UC-RES-02: Điều phối & Sửa ven đường
    // -------------------------------------------------------------------------

    /// <summary>
    /// Tạo mới Repair Order (CarMaintenance) cho rescue roadside.
    /// Gọi khi chẩn đoán xác nhận có thể sửa tại chỗ (BR-07, BR-19).
    /// </summary>
    public async Task<CarMaintenance> CreateMaintenanceAsync(CarMaintenance entity, CancellationToken ct)
    {
        _db.CarMaintenances.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    /// <summary>Lấy Repair Order theo ID để cập nhật trong các bước tiếp theo</summary>
    public async Task<CarMaintenance?> GetMaintenanceByIdAsync(int maintenanceId, CancellationToken ct)
    {
        return await _db.CarMaintenances
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
    }

    /// <summary>
    /// Cập nhật Notes, Status, TotalAmount và CompletedDate của Repair Order.
    /// Chỉ cập nhật các trường có thể thay đổi trong workflow cứu hộ.
    /// </summary>
    public async Task UpdateMaintenanceAsync(CarMaintenance maintenance, CancellationToken ct)
    {
        var entity = await _db.CarMaintenances
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenance.MaintenanceID, ct);
        if (entity == null) return;

        entity.Notes         = maintenance.Notes;
        entity.Status        = maintenance.Status;
        entity.TotalAmount   = maintenance.TotalAmount;
        entity.CompletedDate = maintenance.CompletedDate;

        await _db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Thêm một dòng vật tư/dịch vụ vào Repair Order (BR-20).
    /// Load Product navigation sau khi lưu để phục vụ mapping sang DTO.
    /// </summary>
    public async Task<ServiceDetail> AddServiceDetailAsync(ServiceDetail item, CancellationToken ct)
    {
        _db.ServiceDetails.Add(item);
        await _db.SaveChangesAsync(ct);

        // Load navigation để có ProductName cho response
        await _db.Entry(item).Reference(sd => sd.Product).LoadAsync(ct);
        return item;
    }

    /// <summary>
    /// Lấy toàn bộ vật tư/dịch vụ của một Repair Order — dùng projection để tối ưu
    /// </summary>
    public async Task<IEnumerable<RepairItemResponseDto>> GetRepairItemsAsync(int maintenanceId, CancellationToken ct)
    {
        return await _db.ServiceDetails
            .AsNoTracking()
            .Where(sd => sd.MaintenanceID == maintenanceId)
            .Select(sd => new RepairItemResponseDto
            {
                ServiceDetailId = sd.ServiceDetailID,
                ProductId       = sd.ProductID,
                ProductName     = sd.Product.Name,
                Quantity        = sd.Quantity,
                UnitPrice       = sd.UnitPrice,
                // TotalPrice là computed column; nếu null thì tính lại
                TotalPrice      = sd.TotalPrice ?? (sd.Quantity * sd.UnitPrice),
                Notes           = sd.Notes
            })
            .ToListAsync(ct);
    }

    /// <summary>Validate sản phẩm tồn tại và đang active trước khi ghi vật tư (BR-20)</summary>
    public async Task<Product?> GetProductByIdAsync(int productId, CancellationToken ct)
    {
        return await _db.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProductID == productId && p.IsActive, ct);
    }

    /// <summary>
    /// Kiểm tra xe có đang có Repair Order active không (BR-11: one active RO per vehicle).
    /// Active = status không phải COMPLETED hoặc CANCELLED.
    /// </summary>
    public async Task<bool> HasActiveMaintenanceForCarAsync(int carId, CancellationToken ct)
    {
        return await _db.CarMaintenances
            .AsNoTracking()
            .AnyAsync(m => m.CarID == carId
                        && m.Status != CarMaintenanceStatus.Completed
                        && m.Status != CarMaintenanceStatus.Cancelled, ct);
    }
}
