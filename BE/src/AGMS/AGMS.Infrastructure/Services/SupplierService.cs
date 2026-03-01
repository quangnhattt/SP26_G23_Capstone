using AGMS.Application;
using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Supplier;
using AGMS.Application.DTOs.Unit;
using AGMS.Domain.Entities;

namespace AGMS.Infrastructure.Services
{
    public class SupplierService : ISupplierService
    {
        private readonly ISupplierRepository _supplierRepository;

        public SupplierService(ISupplierRepository supplierRepository)
        {
            _supplierRepository = supplierRepository;
        }

        public async Task<PagedResult<SupplierDto>> GetSuppliersAsync(SupplierFilterDto filter)
        {
            return await _supplierRepository.GetSuppliersAsync(filter);
        }

        public async Task<SupplierDto?> GetSupplierByIdAsync(int id)
        {
            var s = await _supplierRepository.GetByIdAsync(id);
            if (s == null) return null;

            return new SupplierDto
            {
                SupplierID = s.SupplierID,
                Name = s.Name,
                Address = s.Address,
                Phone = s.Phone,
                Email = s.Email,
                Description = s.Description,
                IsActive = s.IsActive,
                CreatedDate = s.CreatedDate
            };
        }

        public async Task<(bool IsSuccess, string Message, SupplierDto? Data)> CreateSupplierAsync(CreateSupplierRequest request)
        {
            // Check trùng lặp
            if (await _supplierRepository.IsNameExistsAsync(request.Name))
                return (false, "MSG_SUP05: Supplier name already exists.", null);

            if (await _supplierRepository.IsPhoneOrEmailExistsAsync(request.Phone, request.Email))
                return (false, "MSG_SUP06: Phone or Email already exists.", null);

            var newSupplier = new Supplier
            {
                Name = request.Name.Trim(),
                Address = request.Address?.Trim(),
                Phone = request.Phone?.Trim(),
                Email = request.Email?.Trim(),
                Description = request.Description?.Trim(),
                IsActive = true,
                CreatedDate = DateTime.Now
            };

            var created = await _supplierRepository.AddAsync(newSupplier);

            var dto = new SupplierDto
            {
                SupplierID = created.SupplierID,
                Name = created.Name,
                Address = created.Address,
                Phone = created.Phone,
                Email = created.Email,
                Description = created.Description,
                IsActive = created.IsActive,
                CreatedDate = created.CreatedDate
            };

            return (true, "MSG_SUP07: Supplier created successfully.", dto);
        }

        public async Task<(bool IsSuccess, string Message)> UpdateSupplierAsync(int id, UpdateSupplierRequest request)
        {
            var existing = await _supplierRepository.GetByIdAsync(id);
            if (existing == null) return (false, "MSG_SUP08: Supplier not found.");

            // Truyền id vào để tránh việc nó báo trùng tên với chính nó
            if (await _supplierRepository.IsNameExistsAsync(request.Name, id))
                return (false, "MSG_SUP05: Supplier name already exists.");

            if (await _supplierRepository.IsPhoneOrEmailExistsAsync(request.Phone, request.Email, id))
                return (false, "MSG_SUP06: Phone or Email already exists.");

            existing.Name = request.Name.Trim();
            existing.Address = request.Address?.Trim();
            existing.Phone = request.Phone?.Trim();
            existing.Email = request.Email?.Trim();
            existing.Description = request.Description?.Trim();
            existing.IsActive = request.IsActive;


            await _supplierRepository.UpdateAsync(existing);
            return (true, "MSG_SUP09: Supplier updated successfully.");
        }

        public async Task<(bool IsSuccess, string Message)> DeactivateSupplierAsync(int id)
        {
            var existing = await _supplierRepository.GetByIdAsync(id);
            if (existing == null) return (false, "MSG_SUP08: Supplier not found.");
            if (!existing.IsActive) return (false, "MSG_SUP10: Supplier is already deactivated.");

            //if (await _supplierRepository.HasPendingOrdersAsync(id))
            //    return (false, "MSG_SUP11: Cannot deactivate supplier with pending orders.");

            existing.IsActive = false;
            await _supplierRepository.UpdateAsync(existing);
            return (true, "MSG_SUP12: Supplier deactivated successfully.");
        }

        public async Task<(bool IsSuccess, string Message)> ActivateSupplierAsync(int id)
        {
            var existing = await _supplierRepository.GetByIdAsync(id);
            if (existing == null) return (false, "MSG_SUP08: Supplier not found.");
            if (existing.IsActive) return (false, "MSG_SUP13: Supplier is already active.");

            existing.IsActive = true;
            await _supplierRepository.UpdateAsync(existing);
            return (true, "MSG_SUP14: Supplier activated successfully.");
        }
    }
}