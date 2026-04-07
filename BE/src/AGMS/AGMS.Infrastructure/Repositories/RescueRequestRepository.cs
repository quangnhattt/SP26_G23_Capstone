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
        string? status, string? rescueType, int? customerId, int? assignedTechnicianId,
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

        if (assignedTechnicianId.HasValue)
            query = query.Where(r => r.AssignedTechnicianID == assignedTechnicianId.Value);

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
                RequiresDeposit    = r.RequiresDeposit,
                DepositAmount      = r.DepositAmount,
                IsDepositPaid      = r.IsDepositPaid,
                DepositPaidDate    = r.DepositPaidDate,
                IsDepositConfirmed = r.IsDepositConfirmed,
                DepositConfirmedDate = r.DepositConfirmedDate,
                DepositConfirmedById = r.DepositConfirmedByID,
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
        entity.SuggestedPartsJson       = rescue.SuggestedPartsJson;
        entity.ServiceAdvisorID         = rescue.ServiceAdvisorID;
        entity.ServiceFee               = rescue.ServiceFee;
        entity.RequiresDeposit          = rescue.RequiresDeposit;
        entity.DepositAmount            = rescue.DepositAmount;
        entity.IsDepositPaid            = rescue.IsDepositPaid;
        entity.DepositPaidDate          = rescue.DepositPaidDate;
        entity.IsDepositConfirmed       = rescue.IsDepositConfirmed;
        entity.DepositConfirmedDate     = rescue.DepositConfirmedDate;
        entity.DepositConfirmedByID     = rescue.DepositConfirmedByID;
        entity.DepositPaymentMethod     = rescue.DepositPaymentMethod;
        entity.DepositTransactionReference = rescue.DepositTransactionReference;
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
                     && !u.IsOnRescueMission
                     && u.CarMaintenanceAssignedTechnicians
                                     .Count(cm => cm.Status != "COMPLETED" && cm.Status != "CANCELLED") == 0
                     )
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
    /// Cập nhật Repair Order: Notes, Status, tất cả trường tài chính và CompletedDate.
    /// Mở rộng để phục vụ cả UC-RES-02 (TotalAmount) lẫn UC-RES-04 (invoice fields).
    /// </summary>
    public async Task UpdateMaintenanceAsync(CarMaintenance maintenance, CancellationToken ct)
    {
        var entity = await _db.CarMaintenances
            .FirstOrDefaultAsync(m => m.MaintenanceID == maintenance.MaintenanceID, ct);
        if (entity == null) return;

        // Trường cơ bản
        entity.Notes         = maintenance.Notes;
        entity.Status        = maintenance.Status;
        entity.TotalAmount   = maintenance.TotalAmount;
        entity.CompletedDate = maintenance.CompletedDate;
        entity.AssignedTechnicianID = maintenance.AssignedTechnicianID;
        entity.MaintenanceType      = maintenance.MaintenanceType;

        // Trường tài chính — cập nhật khi tạo hóa đơn (UC-RES-04 D1, BR-24)
        entity.DiscountAmount        = maintenance.DiscountAmount;
        entity.MemberDiscountAmount  = maintenance.MemberDiscountAmount;
        entity.MemberDiscountPercent = maintenance.MemberDiscountPercent;
        entity.FinalAmount           = maintenance.FinalAmount;
        entity.RankAtTimeOfService   = maintenance.RankAtTimeOfService;

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

    public async Task<IReadOnlyDictionary<int, Product>> GetProductsByIdsAsync(
        IEnumerable<int> productIds,
        CancellationToken ct
    )
    {
        var ids = productIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            return new Dictionary<int, Product>();

        return await _db.Products
            .AsNoTracking()
            .Where(p => ids.Contains(p.ProductID))
            .ToDictionaryAsync(p => p.ProductID, ct);
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

    // -------------------------------------------------------------------------
    // UC-RES-04: Hóa đơn & Thanh toán
    // -------------------------------------------------------------------------

    /// <summary>
    /// Tạo giao dịch thanh toán mới cho Repair Order (BR-23).
    /// PaymentTransaction liên kết với CarMaintenance qua MaintenanceID.
    /// </summary>
    public async Task<PaymentTransaction> CreatePaymentTransactionAsync(PaymentTransaction entity, CancellationToken ct)
    {
        _db.PaymentTransactions.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    /// <summary>
    /// Lấy giao dịch thanh toán gần nhất của một Repair Order.
    /// Sắp xếp theo ngày mới nhất để lấy đúng giao dịch cuối cùng.
    /// </summary>
    public async Task<PaymentTransaction?> GetPaymentByMaintenanceIdAsync(int maintenanceId, CancellationToken ct)
    {
        return await _db.PaymentTransactions
            .AsNoTracking()
            .Where(p => p.MaintenanceID == maintenanceId)
            .OrderByDescending(p => p.PaymentDate)
            .FirstOrDefaultAsync(ct);
    }
}
