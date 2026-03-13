namespace AGMS.Application.DTOs.Symptoms;

public class SymptomSuggestionPartDto
{
    public int ProductId { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public decimal Score { get; set; }
}

