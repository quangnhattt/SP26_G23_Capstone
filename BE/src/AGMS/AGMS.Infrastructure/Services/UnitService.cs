using AGMS.Application;
using AGMS.Application.Contracts; // Gọi Interface Service và Interface Repository
using AGMS.Application.DTOs.Common;
using AGMS.Application.DTOs.Unit;
using System.Threading.Tasks;

namespace AGMS.Infrastructure.Services
{
    public class UnitService : IUnitService
    {
        // gọi Repository
        private readonly IUnitRepository _unitRepository;

        public UnitService(IUnitRepository unitRepository)
        {
            _unitRepository = unitRepository;
        }

        public async Task<PagedResult<UnitDto>> GetUnitsAsync(UnitFilterDto filter)
        {
            
            return await _unitRepository.GetUnitsAsync(filter);
        }

        public async Task<(bool IsSuccess, string Message, UnitDto? Data)> AddUnitAsync(CreateUnitRequest request)
        {
            // Bước 1: Kiểm tra trùng lặp - AF-01 (Unit already exists)
            if (await _unitRepository.IsUnitNameExistsAsync(request.Name))
            {
                return (false, "MSG_UNIT04: Unit already exists", null);
            }

            // Bước 2: Chuẩn bị dữ liệu
            var newUnit = new Domain.Entities.Unit
            {
                Name = request.Name.Trim(),
                Type = request.Type.Trim().ToUpper(), // Ép hoa chữ PART / SERVICE 
                Description = request.Description?.Trim()
            };

            // Bước 3: Gọi Repository để lưu
            var createdUnit = await _unitRepository.AddUnitAsync(newUnit);

            // Bước 4: Chuyển đổi sang DTO để trả về cho Frontend
            var unitDto = new UnitDto
            {
                UnitID = createdUnit.UnitID,
                Name = createdUnit.Name,
                Type = createdUnit.Type,
                Description = createdUnit.Description
            };

            // Thành công - Trả về MSG_UNIT03
            return (true, "MSG_UNIT03: New unit of measure created successfully", unitDto);
        }

        public async Task<(bool IsSuccess, string Message)> UpdateUnitAsync(int id, UpdateUnitRequest request)
        {
            // Bước 1: Kiểm tra Unit có tồn tại không? (Precondition 3)
            var existingUnit = await _unitRepository.GetUnitByIdAsync(id);
            if (existingUnit == null)
            {
                return (false, "Unit not found"); // Hoặc mã lỗi MSG_UNIT_NOT_FOUND tùy quy định
            }

            // Bước 2: Kiểm tra trùng tên - AF-01 (Unit name already exists)
            // Truyền ID hiện tại vào để loại trừ
            if (await _unitRepository.IsUnitNameExistsAsync(request.Name, id))
            {
                return (false, "MSG_UNIT04: Unit already exists");
            }

            // Bước 3: Cập nhật thông tin 
            existingUnit.Name = request.Name.Trim();
            existingUnit.Type = request.Type.Trim().ToUpper();
            existingUnit.Description = request.Description?.Trim();

            // Bước 4: Lưu xuống DB (Step 5)
            await _unitRepository.UpdateUnitAsync(existingUnit);

            // Thành công (Step 6) - Trả về MSG_UNIT06
            return (true, "MSG_UNIT06: Unit updated successfully");
        }

        public async Task<(bool IsSuccess, string Message)> DeleteUnitAsync(int id)
        {
            // 1. Kiểm tra Unit có tồn tại không? (Precondition 3)
            var existingUnit = await _unitRepository.GetUnitByIdAsync(id);
            if (existingUnit == null) // Hoặc kiểm tra thêm: || existingUnit.IsActive == false
            {
                return (false, "Unit not found");
            }

            // 2. Kiểm tra Unit có đang được sử dụng không? (AF-01)
            if (await _unitRepository.IsUnitInUseAsync(id))
            {
                // Trả về lỗi nếu đang có phụ tùng sử dụng
                return (false, "MSG_UNIT08: Unit is in use and cannot be deleted");
            }

            // 3. Thực hiện xóa mềm (Normal Flow - Step 5)
            await _unitRepository.SoftDeleteUnitAsync(id);

            // 4. Thành công (Step 6)
            return (true, "MSG_UNIT07: Unit deleted successfully");
        }
    }
}