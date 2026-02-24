using AGMS.Application.DTOs.Supplier;
using AGMS.Application.DTOs.Unit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface ISupplierService
    {
        Task<PagedResult<SupplierDto>> GetSuppliersAsync(SupplierFilterDto filter);
        Task<SupplierDto?> GetSupplierByIdAsync(int id);

        Task<(bool IsSuccess, string Message, SupplierDto? Data)> CreateSupplierAsync(CreateSupplierRequest request);
        Task<(bool IsSuccess, string Message)> UpdateSupplierAsync(int id, UpdateSupplierRequest request);
        Task<(bool IsSuccess, string Message)> DeactivateSupplierAsync(int id);
        Task<(bool IsSuccess, string Message)> ActivateSupplierAsync(int id);
    }
}