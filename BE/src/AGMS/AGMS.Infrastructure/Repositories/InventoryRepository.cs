using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Inventory;
using AGMS.Domain.Entities;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Repositories;

public class InventoryRepository : IInventoryRepository
{
    private readonly CarServiceDbContext _db;

    public InventoryRepository(CarServiceDbContext db)
    {
        _db = db;
    }

    // NGHIỆP VỤ 1: XỬ LÝ GIAO DỊCH KHO (IN, OUT, ADJUST)

    public async Task ProcessGoodsReceiptAsync(int createdByUserId, CreateGoodsReceiptDto request, CancellationToken ct)
    {
        // 1. MỞ TRANSACTION BAO BỌC TOÀN BỘ QUÁ TRÌNH
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // 2. TẠO PHIẾU NHẬP KHO (Transfer_Order)
            var transferOrder = new TransferOrder
            {
                Type = "GOODS_RECEIPT",
                Status = "APPROVED", // Mặc định duyệt luôn khi nhập
                Note = request.Note,
                DocumentDate = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow,
                CreateBy = createdByUserId, // ID người đang đăng nhập
                SupplierID = request.SupplierId
            };
            _db.TransferOrders.Add(transferOrder);

            // Phải Save để EF Core sinh ra cái TransferOrderID tự động
            await _db.SaveChangesAsync(ct);

            // 3. LẶP QUA TỪNG MÓN HÀNG ĐỂ XỬ LÝ
            foreach (var item in request.Items)
            {
                // [CHỐT CHẶN 1]: Lấy thông tin Sản phẩm Gốc từ DB
                var product = await _db.Products.FirstOrDefaultAsync(p => p.ProductID == item.ProductId, ct);

                if (product == null)
                    throw new Exception($"Thất bại: Sản phẩm có ID {item.ProductId} hoàn toàn chưa tồn tại trong Hệ thống danh mục.");

                // [CHỐT CHẶN 2]: Tuyệt đối không cho phép nhập kho Dịch vụ
                if (product.Type != "PART")
                    throw new InvalidOperationException($"Lỗi nghiệp vụ: Không thể nhập kho cho '{product.Name}'. Vì đây là Dịch vụ/Công thợ, không phải Phụ tùng vật lý.");

                // 3.1. Lưu chi tiết phiếu (Transfer_Order_Detail)
                var toDetail = new TransferOrderDetail
                {
                    TransferOrderID = transferOrder.TransferOrderID,
                    ProductID = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    Notes = item.Note
                };
                _db.TransferOrderDetails.Add(toDetail);

                // 3.2. CẬP NHẬT KHO & TÍNH BÌNH QUÂN GIA QUYỀN (MAC)
                var inventory = await _db.ProductInventories
                    .FirstOrDefaultAsync(i => i.ProductID == item.ProductId, ct);

                // [CHỐT CHẶN 3]: Tự động khởi tạo nếu là Phụ tùng mới tinh lần đầu nhập kho
                if (inventory == null)
                {
                    inventory = new ProductInventory
                    {
                        ProductID = item.ProductId,
                        Quantity = 0,
                        AverageCost = 0,
                        LastUpdated = DateTime.UtcNow
                    };
                    _db.ProductInventories.Add(inventory);
                }

                decimal currentQty = inventory.Quantity;
                decimal currentMac = inventory.AverageCost;

                // Công thức MAC
                decimal totalValueOld = currentQty * currentMac;
                decimal totalValueNew = item.Quantity * item.UnitPrice;
                decimal newQty = currentQty + item.Quantity;

                inventory.AverageCost = newQty > 0 ? (totalValueOld + totalValueNew) / newQty : 0;
                inventory.Quantity = newQty;
                inventory.LastUpdated = DateTime.UtcNow;

                // Nếu là update thì dùng Update, nếu mới add thì EF Core tự tracking
                if (currentQty > 0 || currentMac > 0)
                {
                    _db.ProductInventories.Update(inventory);
                }
                //  AUTO-MAPPING NHÀ CUNG CẤP & SẢN PHẨM
                // =====================================================================
                if (request.SupplierId.HasValue)
                {
                    // Kiểm tra xem đã có liên kết giữa NCC và Sản phẩm này chưa
                    var supplierLink = await _db.SupplierProducts
                        .FirstOrDefaultAsync(sp => sp.SupplierID == request.SupplierId.Value && sp.ProductID == item.ProductId, ct);

                    if (supplierLink == null)
                    {
                        // Chưa có -> Hệ thống tự động học và tạo liên kết mới
                        var newLink = new SupplierProduct
                        {
                            SupplierID = request.SupplierId.Value,
                            ProductID = item.ProductId,
                            DeliveryDuration = 1, // Để mặc định là 1 ngày
                            EstimatedPrice = item.UnitPrice, // Lấy giá nhập kho làm giá tham khảo
                            Policies = "Hệ thống tự động liên kết từ Phiếu nhập kho",
                            IsActive = true
                        };
                        _db.SupplierProducts.Add(newLink);
                    }
                    else
                    {
                        // Đã có -> Cập nhật lại giá tham khảo bằng giá mới nhất trên thị trường
                        supplierLink.EstimatedPrice = item.UnitPrice;
                        _db.SupplierProducts.Update(supplierLink);
                    }
                }
                // =====================================================================

                // 3.3. GHI SỔ CÁI (InventoryTransaction)
                var transaction = new InventoryTransaction
                {
                    ProductID = item.ProductId,
                    ReferenceID = transferOrder.TransferOrderID,
                    TransactionType = "GOODS_RECEIPT",
                    Quantity = item.Quantity,
                    Balance = newQty,
                    UnitCost = item.UnitPrice,
                    TransactionDate = DateTime.UtcNow,
                    Note = item.Note
                };
                _db.InventoryTransactions.Add(transaction);
            }

            // 4. LƯU TẤT CẢ VÀ CHỐT TRANSACTION
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (Exception)
        {
            // Có lỗi ở bất kỳ khâu nào (tạo phiếu, cập nhật giá...) -> Hủy bỏ hết!
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task ProcessStockIssueAsync(int transferOrderId, int approvedByUserId, CancellationToken ct)
    {
        // 1. BẬT LÁ CHẮN TRANSACTION
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // 2. Lôi Phiếu xuất kho (DRAFT) và Chi tiết ra
            var transferOrder = await _db.TransferOrders
                .Include(t => t.TransferOrderDetails)
                .FirstOrDefaultAsync(t => t.TransferOrderID == transferOrderId, ct);

            if (transferOrder == null || transferOrder.Type != "ISSUE")
                throw new Exception("Lỗi: Không tìm thấy Lệnh xuất kho hợp lệ.");

            if (transferOrder.Status == "APPROVED")
                throw new Exception("Lỗi: Phiếu này đã được xuất kho rồi, không thể xuất lại!");

            if (transferOrder.Status != "DRAFT")
                throw new Exception($"Lỗi: Trạng thái phiếu không hợp lệ ({transferOrder.Status}). Chỉ được xuất phiếu DRAFT.");

            // 3. VÒNG LẶP XỬ LÝ TỪNG MÓN HÀNG
            foreach (var detail in transferOrder.TransferOrderDetails)
            {
                // 3.1. Trừ Tồn Kho (ProductInventory)
                var inventory = await _db.ProductInventories
                    .FirstOrDefaultAsync(i => i.ProductID == detail.ProductID, ct);

                if (inventory == null || inventory.Quantity < detail.Quantity)
                    throw new Exception($"LỖI TỒN KHO: Sản phẩm ID {detail.ProductID} không đủ số lượng để xuất. (Cần xuất {detail.Quantity}, Tồn thực tế {inventory?.Quantity ?? 0})");

                inventory.Quantity -= detail.Quantity;
                inventory.LastUpdated = DateTime.UtcNow;
                _db.ProductInventories.Update(inventory);

                // 3.2. Ghi Sổ cái Lịch sử (InventoryTransaction)
                var transaction = new InventoryTransaction
                {
                    ProductID = detail.ProductID,
                    ReferenceID = transferOrder.TransferOrderID,
                    TransactionType = "ISSUE",
                    Quantity = detail.Quantity, // Lưu ý: Xuất kho không ghi số âm, chỉ ghi Type = ISSUE
                    Balance = inventory.Quantity,
                    UnitCost = inventory.AverageCost, // CỰC KỲ QUAN TRỌNG: Lấy Giá Bình Quân hiện hành làm Giá Vốn Xuất
                    TransactionDate = DateTime.UtcNow,
                    Note = "Thực xuất kho từ lệnh sửa chữa"
                };
                _db.InventoryTransactions.Add(transaction);

                // 3.3. BÁO CÁO NGƯỢC LẠI CHO PHÂN HỆ DỊCH VỤ (Cập nhật bảng ServicePartDetails)
                if (transferOrder.RelatedMaintenanceID.HasValue)
                {
                    // Tìm dòng phụ tùng tương ứng trong Hóa đơn
                    var serviceParts = await _db.ServicePartDetails
                        .Where(sp => sp.MaintenanceID == transferOrder.RelatedMaintenanceID.Value
                                  && sp.ProductID == detail.ProductID)
                        .ToListAsync(ct);

                    // Dùng vòng lặp nhồi số lượng đã xuất vào Hóa đơn (Phòng trường hợp cùng 1 phụ tùng nhưng có 2 dòng trong hóa đơn)
                    decimal remainingToIssue = detail.Quantity;
                    foreach (var sp in serviceParts)
                    {
                        if (remainingToIssue <= 0) break;

                        // Tính số lượng còn thiếu chưa xuất của dòng này
                        int needed = sp.Quantity - sp.IssuedQuantity;
                        int issueAmount = (int)Math.Min((decimal)needed, remainingToIssue);

                        if (issueAmount > 0)
                        {
                            sp.IssuedQuantity += issueAmount;
                            remainingToIssue -= issueAmount;

                            // Nếu đã xuất đủ số lượng của dòng này -> Đổi status thành ISSUED
                            if (sp.IssuedQuantity >= sp.Quantity)
                            {
                                sp.InventoryStatus = "ISSUED";
                            }

                            _db.ServicePartDetails.Update(sp);
                        }
                    }
                }
            }

            // 4. CHỐT PHIẾU XUẤT KHO
            transferOrder.Status = "APPROVED";
            transferOrder.ApprovedBy = approvedByUserId; // Ghi nhận thợ nào đã tự bấm duyệt
            _db.TransferOrders.Update(transferOrder);

            // 5. LƯU VÀ ĐÓNG GÓI TRANSACTION
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task ExecuteInventoryMovementAsync(
        int productId, int referenceId, string transactionType,
        decimal quantityChange, decimal inputPrice, string note, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var inventory = await _db.ProductInventories
                .FirstOrDefaultAsync(i => i.ProductID == productId, ct)
                ?? throw new KeyNotFoundException("Product not found in inventory.");

            decimal currentQty = inventory.Quantity;
            decimal currentMac = inventory.AverageCost;
            decimal unitCostToRecord = 0;

            if (transactionType == "GOODS_RECEIPT" || transactionType == "IN")
            {
                // TÍNH BÌNH QUÂN GIA QUYỀN (MAC)
                decimal totalValueOld = currentQty * currentMac;
                decimal totalValueNew = quantityChange * inputPrice;
                decimal newQty = currentQty + quantityChange;

                inventory.AverageCost = newQty > 0 ? (totalValueOld + totalValueNew) / newQty : 0;
                inventory.Quantity = newQty;
                unitCostToRecord = inputPrice; // Sổ cái lưu giá mua thực tế của lô này
            }
            else if (transactionType == "ISSUE" || transactionType == "OUT")
            {
                if (currentQty < quantityChange)
                    throw new InvalidOperationException("Kho không đủ số lượng để xuất.");

                inventory.Quantity -= quantityChange;
                unitCostToRecord = currentMac; // Sổ cái lưu giá xuất = Giá MAC hiện hành
            }
            else if (transactionType == "ADJUST" || transactionType == "ADJUST_IN" || transactionType == "ADJUST_OUT" || transactionType == "WRITE_OFF")
            {
                // quantityChange có thể là số âm (mất mát) hoặc dương (nhập dư)
                inventory.Quantity += quantityChange;
                unitCostToRecord = currentMac; // Điều chỉnh thì tính theo giá trị hiện tại
            }

            inventory.LastUpdated = DateTime.UtcNow;
            _db.ProductInventories.Update(inventory);

            // GHI SỔ KẾ TOÁN KHO (LEDGER)
            var transaction = new InventoryTransaction
            {
                ProductID = productId,
                ReferenceID = referenceId,
                TransactionType = transactionType,
                Quantity = Math.Abs(quantityChange), // Transaction luôn ghi số dương
                Balance = inventory.Quantity, // Tồn kho ngay sau khi giao dịch
                UnitCost = unitCostToRecord,
                TransactionDate = DateTime.UtcNow,
                Note = note
            };
            _db.InventoryTransactions.Add(transaction);

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            await tx.RollbackAsync(ct);
            // Đây là sức mạnh của cột [RowVersion]
            throw new Exception("Lỗi đồng bộ: Dữ liệu kho vừa bị thay đổi bởi một nhân viên khác. Vui lòng tải lại trang và thử lại!");
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    // NGHIỆP VỤ 2: ĐỐI SOÁT CHỨNG MINH TÍNH NHẤT QUÁN CỦA DB
    public async Task<List<InventoryDiscrepancyDto>> GetInventoryDiscrepanciesAsync(CancellationToken ct)
    {
        // Truy vấn này lấy Số Tồn Snapshot đem so sánh với Tổng Lịch sử
        var discrepancies = await _db.ProductInventories
            .Select(inv => new InventoryDiscrepancyDto
            {
                ProductID = inv.ProductID,
                ProductCode = inv.Product.Code,
                SnapshotQuantity = inv.Quantity,
                LedgerQuantity = _db.InventoryTransactions
                    .Where(t => t.ProductID == inv.ProductID)
                    .Sum(t =>
                        (t.TransactionType == "GOODS_RECEIPT" || t.TransactionType == "IN" || t.TransactionType == "RETURN" || t.TransactionType == "ADJUST_IN") ? t.Quantity :
                        (t.TransactionType == "ISSUE" || t.TransactionType == "OUT" || t.TransactionType == "WRITE_OFF" || t.TransactionType == "ADJUST_OUT") ? -t.Quantity :
                        t.TransactionType == "ADJUST" ? t.Quantity : 0)
            })
            .Where(x => x.SnapshotQuantity != x.LedgerQuantity) // Chỉ lấy ra những mã hàng bị lệch (nếu có)
            .ToListAsync(ct);

        return discrepancies;
    }

    public async Task<CreateIssueTransferOrderResultDto> CreateIssueTransferOrderFromServiceOrderAsync(
        int maintenanceId,
        int createdByUserId,
        CancellationToken ct)
    {
        var maintenanceExists = await _db.CarMaintenances
            .AsNoTracking()
            .AnyAsync(m => m.MaintenanceID == maintenanceId, ct);

        if (!maintenanceExists)
            throw new KeyNotFoundException($"Không tìm thấy service order với ID = {maintenanceId}.");
        var hasPendingServiceItems = await _db.ServiceDetails.AnyAsync(sd => sd.MaintenanceID == maintenanceId && sd.ItemStatus == "PENDING", ct);
        var hasPendingPartItems = await _db.ServicePartDetails.AnyAsync(spd => spd.MaintenanceID == maintenanceId && spd.ItemStatus == "PENDING", ct);
        if (hasPendingServiceItems || hasPendingPartItems)
        {
            throw new InvalidOperationException(
                "Không thể tạo phiếu xuất khi còn hạng mục PENDING. Tất cả item phải ở trạng thái APPROVED hoặc REJECTED.");
        }
        var candidateParts = await _db.ServicePartDetails
            .Where(spd => spd.MaintenanceID == maintenanceId
                          && spd.ItemStatus == "APPROVED"
                          && (spd.InventoryStatus == "PENDING" || spd.InventoryStatus == "RESERVED")
                          && spd.ReservedTransferOrderID == null
                          && spd.Quantity > spd.IssuedQuantity)
            .ToListAsync(ct);

        if (!candidateParts.Any())
            throw new InvalidOperationException("Không có phụ tùng hợp lệ để tạo phiếu xuất.");

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var transferOrder = new TransferOrder
            {
                Type = "ISSUE",
                Status = "DRAFT",
                Note = $"Auto-created from service order #{maintenanceId}",
                DocumentDate = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow,
                CreateBy = createdByUserId,
                RelatedMaintenanceID = maintenanceId
            };
            _db.TransferOrders.Add(transferOrder);
            await _db.SaveChangesAsync(ct);

            foreach (var part in candidateParts)
            {
                var remainingQty = part.Quantity - part.IssuedQuantity;
                if (remainingQty <= 0)
                    continue;

                _db.TransferOrderDetails.Add(new TransferOrderDetail
                {
                    TransferOrderID = transferOrder.TransferOrderID,
                    ProductID = part.ProductID,
                    Quantity = remainingQty,
                    UnitPrice = part.UnitPrice,
                    Notes = part.Notes
                });

                part.ReservedTransferOrderID = transferOrder.TransferOrderID;
                part.InventoryStatus = "RESERVED";
            }

            var maintenance = await _db.CarMaintenances
                .FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
            if (maintenance != null && !string.Equals(maintenance.Status, "IN_PROGRESS", StringComparison.OrdinalIgnoreCase))
            {
                maintenance.Status = "IN_PROGRESS";
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return new CreateIssueTransferOrderResultDto
            {
                TransferOrderId = transferOrder.TransferOrderID,
                MaintenanceId = maintenanceId,
                ItemCount = candidateParts.Count
            };
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<PaginatedResult<InventoryTransactionHistoryDto>> GetTransactionHistoryAsync(InventoryTransactionFilterDto filter, CancellationToken ct)
    {
        // 1. Khởi tạo Query (Nối bảng InventoryTransaction với bảng Product để lấy Tên & Mã)
        var query = _db.InventoryTransactions
            .Include(t => t.Product)
            .AsQueryable();

        // 2. Lọc động (Dynamic Filtering)
        if (filter.ProductId.HasValue)
            query = query.Where(t => t.ProductID == filter.ProductId.Value);

        if (!string.IsNullOrEmpty(filter.TransactionType))
            query = query.Where(t => t.TransactionType == filter.TransactionType);

        if (filter.FromDate.HasValue)
            query = query.Where(t => t.TransactionDate >= filter.FromDate.Value);

        if (filter.ToDate.HasValue)
            query = query.Where(t => t.TransactionDate <= filter.ToDate.Value);

        // 3. Đếm tổng số dòng (phục vụ phân trang)
        int totalCount = await query.CountAsync(ct);

        // 4. Phân trang & Map sang DTO
        var items = await query
            .OrderByDescending(t => t.TransactionDate) // Luôn ưu tiên xếp giao dịch mới nhất lên đầu
            .Skip((filter.PageIndex - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(t => new InventoryTransactionHistoryDto
            {
                TransactionID = t.TransactionID,
                ProductID = t.ProductID,
                ProductCode = t.Product != null ? t.Product.Code : "N/A",
                ProductName = t.Product != null ? t.Product.Name : "N/A",
                ReferenceID = t.ReferenceID,
                TransactionType = t.TransactionType,
                Quantity = t.Quantity,
                Balance = t.Balance,
                UnitCost = t.UnitCost,
                TransactionDate = t.TransactionDate,
                Note = t.Note
            })
            .ToListAsync(ct);

        return new PaginatedResult<InventoryTransactionHistoryDto>
        {
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize),
            CurrentPage = filter.PageIndex,
            Items = items
        };
    }

    public async Task AdjustStockAsync(int userId, InventoryAdjustmentDto request, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            if (request.ActualQuantity < 0)
                throw new InvalidOperationException("Lỗi: Số lượng đếm thực tế (ActualQuantity) không thể là số âm.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserID == userId, ct);
            string fullName = user?.FullName ?? $"user {userId}";

            var inventory = await _db.ProductInventories
                .FirstOrDefaultAsync(i => i.ProductID == request.ProductId, ct);

            if (inventory == null)
                throw new KeyNotFoundException($"Product with ID {request.ProductId} not found in inventory.");

            decimal currentQty = inventory.Quantity;
            decimal quantityChange = request.ActualQuantity - currentQty;

            if (quantityChange == 0)
                throw new InvalidOperationException("Số lượng đếm thực tế bằng với số lượng hệ thống. Không có điều chỉnh nào được thực hiện.");

            // 1. Tạo TransferOrder để lấy ReferenceID (tránh lỗi khóa ngoại FK ReferenceID)
            string note = $"Kiểm kê vật lý bởi {fullName}. Điều chỉnh biên độ: {(quantityChange > 0 ? "+" : "")}{quantityChange}";

            var transferOrder = new TransferOrder
            {
                Type = "ADJUST",
                Status = "APPROVED",
                Note = note,
                DocumentDate = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow,
                CreateBy = userId
            };
            _db.TransferOrders.Add(transferOrder);
            await _db.SaveChangesAsync(ct); // Insert để lấy ID

            // 2. Lưu chi tiết phiếu (giúp minh bạch hơn)
            _db.TransferOrderDetails.Add(new TransferOrderDetail
            {
                TransferOrderID = transferOrder.TransferOrderID,
                ProductID = request.ProductId,
                Quantity = Math.Abs(quantityChange), // Chi tiết phiếu lưu số lượng tuyệt đối
                UnitPrice = inventory.AverageCost, // Lấy giá xuất bằng giá vốn bình quân (MAC)
                Notes = note
            });

            // 3. Cập nhật Tồn kho
            inventory.Quantity += quantityChange;
            inventory.LastUpdated = DateTime.UtcNow;
            _db.ProductInventories.Update(inventory);

            // 4. Ghi Sổ cái (Ledger - InventoryTransaction)
            string transactionType = quantityChange > 0 ? "ADJUST_IN" : "ADJUST_OUT";
            var transaction = new InventoryTransaction
            {
                ProductID = request.ProductId,
                ReferenceID = transferOrder.TransferOrderID, // Khóa ngoại chĩa vào Phiếu vừa lập
                TransactionType = transactionType,
                Quantity = Math.Abs(quantityChange),
                Balance = inventory.Quantity,
                UnitCost = inventory.AverageCost, // CỰC KỲ QUAN TRỌNG: Lấy giá trị MAC không đổi!
                TransactionDate = DateTime.UtcNow,
                Note = note
            };
            _db.InventoryTransactions.Add(transaction);

            // 5. Chốt!
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task RebuildInventoryBalancesAsync(CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var inventories = await _db.ProductInventories.ToListAsync(ct);

            foreach (var inv in inventories)
            {
                var ledgerSum = await _db.InventoryTransactions
                    .Where(t => t.ProductID == inv.ProductID)
                    .SumAsync(t =>
                        (t.TransactionType == "GOODS_RECEIPT" || t.TransactionType == "IN" || t.TransactionType == "RETURN" || t.TransactionType == "ADJUST_IN") ? t.Quantity :
                        (t.TransactionType == "ISSUE" || t.TransactionType == "OUT" || t.TransactionType == "WRITE_OFF" || t.TransactionType == "ADJUST_OUT") ? -t.Quantity :
                        t.TransactionType == "ADJUST" ? t.Quantity : 0, ct);

                if (inv.Quantity != ledgerSum)
                {
                    inv.Quantity = ledgerSum;
                    inv.LastUpdated = DateTime.UtcNow;
                    _db.ProductInventories.Update(inv);
                }
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<int> CreateSurplusReturnDraftAsync(int maintenanceId, int processedByUserId, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var maintenance = await _db.CarMaintenances.FirstOrDefaultAsync(m => m.MaintenanceID == maintenanceId, ct);
            if (maintenance == null) throw new KeyNotFoundException($"Không tìm thấy ca bảo dưỡng #{maintenanceId}.");

            // 1. Kiểm tra chống double run
            bool alreadyHasReturn = await _db.TransferOrders.AnyAsync(to => 
                to.RelatedMaintenanceID == maintenanceId 
                && to.Type == "RETURN" 
                && (to.Status == "APPROVED" || to.Status == "DRAFT" || to.Status == "PENDING"), ct);
            
            if (alreadyHasReturn) throw new InvalidOperationException("Hệ thống đã ghi nhận một phiếu hoàn trả cho ca cứu hộ này. Không thể tạo thêm.");

            // 2. Truy vấn Sổ cái (Ledger): Group theo ProductId
            var ledgerIssues = await _db.InventoryTransactions
                .Where(t => t.Reference.RelatedMaintenanceID == maintenanceId && t.TransactionType == "ISSUE")
                .GroupBy(t => t.ProductID)
                .Select(g => new { ProductID = g.Key, TotalIssued = g.Sum(x => x.Quantity) })
                .ToListAsync(ct);

            // 3. Truy vấn Thực dùng từ ServicePartDetail
            var actualUsages = await _db.ServicePartDetails
                .Include(sp => sp.Product)
                .Where(sp => sp.MaintenanceID == maintenanceId)
                .ToListAsync(ct);

            var itemsToReturn = new List<(ServicePartDetail Part, decimal Surplus)>();

            // 4. Detect chênh lệch
            foreach (var usage in actualUsages)
            {
                var ledgerRecord = ledgerIssues.FirstOrDefault(l => l.ProductID == usage.ProductID);
                decimal totalIssued = ledgerRecord?.TotalIssued ?? 0m;
                
                decimal surplus = totalIssued - usage.Quantity;

                if (usage.Quantity > totalIssued)
                {
                    throw new InvalidOperationException($"Lỗi đồng bộ dữ liệu: Linh kiện {usage.Product?.Code} có số lượng sử dụng ({usage.Quantity}) lớn hơn tổng số lượng thực xuất kho ban đầu ({totalIssued}). KTV cần tạo phiếu xuất kho bổ sung.");
                }

                if (surplus > 0)
                {
                    itemsToReturn.Add((usage, surplus));
                }
            }

            if (!itemsToReturn.Any()) return 0; // Không có gì để hoàn

            // 5. Tạo TransferOrder DRAFT
            var draftOrder = new TransferOrder
            {
                Type = "RETURN",
                Status = "DRAFT", // Nháp
                Note = $"Thu hồi hàng dư từ ca Cứu hộ #{maintenanceId}",
                DocumentDate = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow,
                CreateBy = processedByUserId,
                ApprovedBy = null,
                RelatedMaintenanceID = maintenanceId
            };
            
            _db.TransferOrders.Add(draftOrder);
            await _db.SaveChangesAsync(ct); 

            // 6. Thêm Chi tiết Phiếu DRAFT (KHÔNG đụng tới kho hay sổ cái ở đây)
            foreach (var item in itemsToReturn)
            {
                var detail = new TransferOrderDetail
                {
                    TransferOrderID = draftOrder.TransferOrderID,
                    ProductID = item.Part.ProductID,
                    Quantity = item.Surplus,
                    UnitPrice = item.Part.UnitPrice,
                    Notes = $"Thu hồi lại {item.Surplus} sp"
                };
                _db.TransferOrderDetails.Add(detail);
                
                // BỎ QUA GÁN TRẠNG THÁI VÌ DATABASE CÓ CHECK CONSTRAINT CHO InventoryStatus
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return draftOrder.TransferOrderID;
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(ct);
            throw new Exception(ex.InnerException != null ? ex.Message + " | Inner: " + ex.InnerException.Message : ex.Message);
        }
    }

    public async Task ApproveSurplusReturnAsync(int transferOrderId, int approvedByUserId, CancellationToken ct)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var returnOrder = await _db.TransferOrders
                .Include(t => t.TransferOrderDetails)
                .FirstOrDefaultAsync(t => t.TransferOrderID == transferOrderId, ct);

            if (returnOrder == null || returnOrder.Type != "RETURN")
                throw new Exception("Lỗi: Lệnh hoàn trả không hợp lệ.");

            if (returnOrder.Status == "APPROVED")
                throw new Exception("Lỗi: Phiếu hoàn trả này đã được phê duyệt.");

            if (returnOrder.Status != "DRAFT" && returnOrder.Status != "PENDING")
                throw new Exception($"Lỗi: Trạng thái ({returnOrder.Status}) không hợp lệ để duyệt.");

            // 2. Chốt kho: Cộng vô Quantity & Ghi Transaction
            foreach (var detail in returnOrder.TransferOrderDetails)
            {
                var inventory = await _db.ProductInventories.FirstOrDefaultAsync(i => i.ProductID == detail.ProductID, ct);
                if (inventory != null)
                {
                    // Update Stock CHỈ CỘNG, KHÔNG THAY ĐỔI MAC (Giữ giá vốn)
                    inventory.Quantity += detail.Quantity;
                    inventory.LastUpdated = DateTime.UtcNow;
                    _db.ProductInventories.Update(inventory);

                    // Sổ Cái 
                    var transaction = new InventoryTransaction
                    {
                        ProductID = detail.ProductID,
                        ReferenceID = returnOrder.TransferOrderID,
                        TransactionType = "RETURN_FROM_RESCUE",
                        Quantity = detail.Quantity,
                        Balance = inventory.Quantity,
                        UnitCost = inventory.AverageCost, // Giữ nguyên cost
                        TransactionDate = DateTime.UtcNow,
                        Note = "Xác nhận nhận lại linh kiện"
                    };
                    _db.InventoryTransactions.Add(transaction);
                }
            }

            // 3. (BỎ QUA CẬP NHẬT InventoryStatus VÌ LÝ DO RÀNG BUỘC CƠ SỞ DỮ LIỆU)

            returnOrder.Status = "APPROVED";
            returnOrder.ApprovedBy = approvedByUserId;
            _db.TransferOrders.Update(returnOrder);

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(ct);
            throw new Exception(ex.InnerException != null ? ex.Message + " | Inner: " + ex.InnerException.Message : ex.Message);
        }
    }

    public async Task<List<int>> AutoDetectAndCreateSurplusReturnsAsync(int processedByUserId, CancellationToken ct)
    {
        // Chỉ lấy những ca đã có xuất kho thực sự để đối soát
        var candidateMaintenanceIdsFromParts = await _db.ServicePartDetails
            .Where(sp => sp.InventoryStatus == "ISSUED")
            .Select(sp => sp.MaintenanceID)
            .Distinct()
            .ToListAsync(ct);

        // Lọc bỏ đi những ca đã có Phiếu Return rồi để không quét trùng
        var alreadyReturnedMaintenanceIds = await _db.TransferOrders
            .Where(to => to.Type == "RETURN" && to.RelatedMaintenanceID != null)
            .Select(to => to.RelatedMaintenanceID!.Value)
            .Distinct()
            .ToListAsync(ct);

        var candidateMaintenanceIds = candidateMaintenanceIdsFromParts
            .Except(alreadyReturnedMaintenanceIds)
            .ToList();

        var createdDraftIds = new List<int>();
        var errors = new List<string>();

        foreach (var maintenanceId in candidateMaintenanceIds)
        {
            try
            {
                int newTransferOrderId = await CreateSurplusReturnDraftAsync(maintenanceId, processedByUserId, ct);
                if (newTransferOrderId > 0)
                {
                    createdDraftIds.Add(newTransferOrderId);
                }
            }
            catch (Exception ex)
            {
                string errorMessage = ex.Message;
                if (ex.InnerException != null) errorMessage += " | Inner: " + ex.InnerException.Message;
                errors.Add($"Ca {maintenanceId} bị lỗi: {errorMessage}");
                continue;
            }
        }

        if (errors.Any() && !createdDraftIds.Any())
        {
            throw new Exception("Hệ thống quét không ra linh kiện dư được cấp phép do kẹt dữ liệu: " + string.Join(" | ", errors));
        }

        return createdDraftIds;
    }

    // ============================================================
    // API 1: Kỹ thuật viên xem danh sách phiếu xuất kho của mình
    // Logic: Lọc TransferOrder qua RelatedMaintenance.AssignedTechnicianID == technicianUserId
    // ============================================================
    public async Task<List<MyTransferOrderDto>> GetMyTransferOrdersAsync(int technicianUserId, CancellationToken ct)
    {
        var result = await _db.TransferOrders
            .Where(to => to.Type == "ISSUE"
                      && to.RelatedMaintenanceID != null
                      && to.RelatedMaintenance != null
                      && to.RelatedMaintenance.AssignedTechnicianID == technicianUserId)
            .Include(to => to.RelatedMaintenance)
                .ThenInclude(m => m!.Car)
            .Include(to => to.TransferOrderDetails)
                .ThenInclude(d => d.Product)   // <<< Thêm để lấy Product.Code, Product.Name
            .OrderByDescending(to => to.DocumentDate)
            .Select(to => new MyTransferOrderDto
            {
                TransferOrderID   = to.TransferOrderID,
                Status            = to.Status,
                Note              = to.Note,
                DocumentDate      = to.DocumentDate,
                CreatedDate       = to.CreatedDate,
                // Thông tin đơn sửa chữa
                MaintenanceID     = to.RelatedMaintenanceID,
                MaintenanceStatus = to.RelatedMaintenance != null ? to.RelatedMaintenance.Status : string.Empty,
                // Thông tin xe
                CarLicensePlate   = to.RelatedMaintenance != null && to.RelatedMaintenance.Car != null
                                        ? to.RelatedMaintenance.Car.LicensePlate : null,
                CarModel          = to.RelatedMaintenance != null && to.RelatedMaintenance.Car != null
                                        ? to.RelatedMaintenance.Car.Model : null,
                CarBrand          = to.RelatedMaintenance != null && to.RelatedMaintenance.Car != null
                                        ? to.RelatedMaintenance.Car.Brand : null,
                // Tổng số dòng (badge hiển thị nhanh)
                ItemCount         = to.TransferOrderDetails.Count,
                // Chi tiết từng linh kiện (tech cần biết xuất cái gì, số lượng bao nhiêu)
                Details = to.TransferOrderDetails.Select(d => new TransferOrderDetailItemDto
                {
                    OrderDetailID = d.OrderDetailID,
                    ProductID     = d.ProductID,
                    ProductCode   = d.Product != null ? d.Product.Code : "N/A",
                    ProductName   = d.Product != null ? d.Product.Name : "N/A",
                    Quantity      = d.Quantity,
                    UnitPrice     = d.UnitPrice,
                    InventoryStatus = to.RelatedMaintenanceID.HasValue
                        ? _db.ServicePartDetails
                            .Where(sp => sp.MaintenanceID == to.RelatedMaintenanceID.Value && sp.ProductID == d.ProductID)
                            .OrderByDescending(sp => sp.ServicePartDetailID)
                            .Select(sp => sp.InventoryStatus)
                            .FirstOrDefault()
                        : null,
                    Notes         = d.Notes
                }).ToList()
            })
            .ToListAsync(ct);

        return result;
    }

    // ============================================================
    // API 2: Admin/SA xem toàn bộ Transfer Order kèm chi tiết linh kiện
    // Hỗ trợ filter theo Type, Status, MaintenanceId, TechnicianId và phân trang
    // ============================================================
    public async Task<PaginatedResult<TransferOrderWithDetailsDto>> GetAllTransferOrdersWithDetailsAsync(
        TransferOrderFilterDto filter, CancellationToken ct)
    {
        // 1. Khởi tạo query gốc với các Include cần thiết
        var query = _db.TransferOrders
            .Include(to => to.TransferOrderDetails)
                .ThenInclude(d => d.Product)
            .Include(to => to.CreateByNavigation)
            .Include(to => to.ApprovedByNavigation)
            .Include(to => to.RelatedMaintenance)
                .ThenInclude(m => m!.AssignedTechnician)
            .Include(to => to.RelatedMaintenance)
                .ThenInclude(m => m!.Car)
            .AsQueryable();

        // 2. Lọc động theo filter
        if (!string.IsNullOrWhiteSpace(filter.Type))
            query = query.Where(to => to.Type == filter.Type);

        if (!string.IsNullOrWhiteSpace(filter.Status))
            query = query.Where(to => to.Status == filter.Status);

        if (filter.MaintenanceId.HasValue)
            query = query.Where(to => to.RelatedMaintenanceID == filter.MaintenanceId.Value);

        if (filter.TechnicianId.HasValue)
            query = query.Where(to => to.RelatedMaintenance != null
                                   && to.RelatedMaintenance.AssignedTechnicianID == filter.TechnicianId.Value);

        // 3. Đếm tổng (phục vụ phân trang)
        int totalCount = await query.CountAsync(ct);

        // 4. Phân trang + Map sang DTO
        var items = await query
            .OrderByDescending(to => to.DocumentDate)
            .Skip((filter.PageIndex - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(to => new TransferOrderWithDetailsDto
            {
                TransferOrderID   = to.TransferOrderID,
                Type              = to.Type,
                Status            = to.Status,
                Note              = to.Note,
                DocumentDate      = to.DocumentDate,
                CreatedDate       = to.CreatedDate,
                // Người tạo
                CreateByUserId    = to.CreateBy,
                CreatedByName     = to.CreateByNavigation != null ? to.CreateByNavigation.FullName : "N/A",
                // Người duyệt (nếu có)
                ApprovedByUserId  = to.ApprovedBy,
                ApprovedByName    = to.ApprovedByNavigation != null ? to.ApprovedByNavigation.FullName : null,
                // Thông tin đơn sửa chữa
                MaintenanceID     = to.RelatedMaintenanceID,
                MaintenanceStatus = to.RelatedMaintenance != null ? to.RelatedMaintenance.Status : null,
                // Kỹ thuật viên
                TechnicianID      = to.RelatedMaintenance != null ? to.RelatedMaintenance.AssignedTechnicianID : null,
                TechnicianName    = to.RelatedMaintenance != null && to.RelatedMaintenance.AssignedTechnician != null
                                        ? to.RelatedMaintenance.AssignedTechnician.FullName : null,
                // Thông tin xe
                CarLicensePlate   = to.RelatedMaintenance != null && to.RelatedMaintenance.Car != null
                                        ? to.RelatedMaintenance.Car.LicensePlate : null,
                CarModel          = to.RelatedMaintenance != null && to.RelatedMaintenance.Car != null
                                        ? to.RelatedMaintenance.Car.Model : null,
                // Chi tiết linh kiện
                Details = to.TransferOrderDetails.Select(d => new TransferOrderDetailItemDto
                {
                    OrderDetailID = d.OrderDetailID,
                    ProductID     = d.ProductID,
                    ProductCode   = d.Product != null ? d.Product.Code : "N/A",
                    ProductName   = d.Product != null ? d.Product.Name : "N/A",
                    Quantity      = d.Quantity,
                    UnitPrice     = d.UnitPrice,
                    InventoryStatus = to.RelatedMaintenanceID.HasValue
                        ? _db.ServicePartDetails
                            .Where(sp => sp.MaintenanceID == to.RelatedMaintenanceID.Value && sp.ProductID == d.ProductID)
                            .OrderByDescending(sp => sp.ServicePartDetailID)
                            .Select(sp => sp.InventoryStatus)
                            .FirstOrDefault()
                        : null,
                    Notes         = d.Notes
                }).ToList()
            })
            .ToListAsync(ct);

        return new PaginatedResult<TransferOrderWithDetailsDto>
        {
            TotalCount   = totalCount,
            TotalPages   = (int)Math.Ceiling(totalCount / (double)filter.PageSize),
            CurrentPage  = filter.PageIndex,
            Items        = items
        };
    }
}