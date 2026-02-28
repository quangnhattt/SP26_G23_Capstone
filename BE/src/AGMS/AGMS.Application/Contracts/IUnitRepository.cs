using AGMS.Application.DTOs.Unit;
using AGMS.Domain.Entities;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface IUnitRepository
    {
        // 1. Xem danh sách
        Task<PagedResult<UnitDto>> GetUnitsAsync(UnitFilterDto filter);

        // 2. Thêm mới
        Task<bool> IsUnitNameExistsAsync(string name);
        Task<Unit> AddUnitAsync(Unit unit);

        // 3. Cập nhật
        Task<Unit?> GetUnitByIdAsync(int id);
        Task<bool> IsUnitNameExistsAsync(string name, int excludeId);
        Task UpdateUnitAsync(Unit unit);

        // 4. Xóa (Mới thêm)
        Task<bool> IsUnitInUseAsync(int unitId);
        Task SoftDeleteUnitAsync(int unitId);
    }
}