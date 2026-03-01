using AGMS.Application.DTOs.Supplier;
using AGMS.Application.DTOs.Unit;
using AGMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading.Tasks;

namespace AGMS.Application.Contracts
{
    public interface ISupplierRepository
    {
        Task<PagedResult<SupplierDto>> GetSuppliersAsync(SupplierFilterDto filter);
        Task<Supplier?> GetByIdAsync(int id);
        Task<bool> IsNameExistsAsync(string name, int? excludeId = null);
        Task<bool> IsPhoneOrEmailExistsAsync(string? phone, string? email, int? excludeId = null);
        Task<bool> HasPendingOrdersAsync(int supplierId);
        Task<Supplier> AddAsync(Supplier supplier);
        Task UpdateAsync(Supplier supplier);
    }
}