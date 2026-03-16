namespace AGMS.Domain.Entities;

public class SymptomProduct
{
    public int SymptomID { get; set; }
    public int ProductID { get; set; }
    public decimal Weight { get; set; }
    public string? Note { get; set; }

    public virtual Symptom Symptom { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}

