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
            else if (transactionType == "ADJUST" || transactionType == "WRITE_OFF")
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
                        (t.TransactionType == "GOODS_RECEIPT" || t.TransactionType == "IN" || t.TransactionType == "RETURN") ? t.Quantity :
                        (t.TransactionType == "ISSUE" || t.TransactionType == "OUT" || t.TransactionType == "WRITE_OFF") ? -t.Quantity :
                        // Xử lý riêng cho ADJUST nếu bạn cấu hình loại phiếu ADJUST ghi số dương/âm tùy ý
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
}