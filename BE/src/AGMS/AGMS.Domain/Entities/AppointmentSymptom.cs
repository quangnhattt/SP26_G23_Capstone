namespace AGMS.Domain.Entities;

public class AppointmentSymptom
{
    public int AppointmentID { get; set; }
    public int SymptomID { get; set; }

    public virtual Appointment Appointment { get; set; } = null!;
    public virtual Symptom Symptom { get; set; } = null!;
}

