namespace AGMS.Application.Contracts;

/// <summary>
/// Trừu tượng quản lý transaction ở tầng application để service không phụ thuộc trực tiếp DbContext.
/// </summary>
public interface ITransactionManager
{
    /// <summary>
    /// Chạy một khối lệnh trong transaction.
    /// Nếu transaction đã tồn tại ở scope hiện tại thì dùng lại transaction đó.
    /// </summary>
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> action, CancellationToken ct);
}
