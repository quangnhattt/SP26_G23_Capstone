using AGMS.Application.DTOs.Symptoms;

namespace AGMS.Application.Contracts;

public interface ISymptomService
{
    Task<IReadOnlyList<SymptomDto>> GetAllAsync(CancellationToken ct);
    Task<IReadOnlyList<SymptomSuggestionPartDto>> GetSuggestedPartsForAppointmentAsync(int appointmentId, CancellationToken ct);
}

