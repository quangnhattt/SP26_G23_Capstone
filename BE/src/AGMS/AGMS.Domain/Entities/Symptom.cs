namespace AGMS.Domain.Entities;

public class Symptom
{
    public int SymptomID { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }

    public virtual ICollection<SymptomProduct> SymptomProducts { get; set; } = new List<SymptomProduct>();
    public virtual ICollection<AppointmentSymptom> AppointmentSymptoms { get; set; } = new List<AppointmentSymptom>();
}

