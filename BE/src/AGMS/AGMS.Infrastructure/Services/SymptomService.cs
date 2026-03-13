using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Symptoms;
using AGMS.Infrastructure.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Services;

public class SymptomService : ISymptomService
{
    private readonly CarServiceDbContext _db;

    public SymptomService(CarServiceDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<SymptomDto>> GetAllAsync(CancellationToken ct)
    {
        var items = await _db.Symptoms
            .Where(s => s.IsActive)
            .OrderBy(s => s.DisplayOrder)
            .ThenBy(s => s.Name)
            .Select(s => new SymptomDto
            {
                Id = s.SymptomID,
                Code = s.Code,
                Name = s.Name,
                Description = s.Description
            })
            .ToListAsync(ct);

        return items;
    }

    public async Task<IReadOnlyList<SymptomSuggestionPartDto>> GetSuggestedPartsForAppointmentAsync(int appointmentId, CancellationToken ct)
    {
        // Lấy danh sách SymptomID của appointment
        var symptomIds = await _db.AppointmentSymptoms
            .Where(x => x.AppointmentID == appointmentId)
            .Select(x => x.SymptomID)
            .Distinct()
            .ToListAsync(ct);

        if (symptomIds.Count == 0)
        {
            return Array.Empty<SymptomSuggestionPartDto>();
        }

        // Join SymptomProducts + Product, group theo ProductID, tính Score = SUM(Weight)
        var query =
            from sp in _db.SymptomProducts
            join p in _db.Products on sp.ProductID equals p.ProductID
            where symptomIds.Contains(sp.SymptomID)
                  && p.IsActive
                  && p.Type == "PART"
            group new { sp, p } by new { sp.ProductID, p.Code, p.Name, p.Price } into g
            orderby g.Sum(x => x.sp.Weight) descending
            select new SymptomSuggestionPartDto
            {
                ProductId = g.Key.ProductID,
                Code = g.Key.Code,
                Name = g.Key.Name,
                Price = g.Key.Price,
                Score = g.Sum(x => x.sp.Weight)
            };

        var result = await query.ToListAsync(ct);
        return result;
    }
}

