using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AGMS.Application.DTOs.Unit;
using System.Threading.Tasks;

namespace AGMS.Application
{
    public interface IUnitService
    {
        Task<PagedResult<UnitDto>> GetUnitsAsync(UnitFilterDto filter);

        Task<(bool IsSuccess, string Message, UnitDto? Data)> AddUnitAsync(CreateUnitRequest request);
        Task<(bool IsSuccess, string Message)> UpdateUnitAsync(int id, UpdateUnitRequest request);
        Task<(bool IsSuccess, string Message)> DeleteUnitAsync(int id);

    }
}
