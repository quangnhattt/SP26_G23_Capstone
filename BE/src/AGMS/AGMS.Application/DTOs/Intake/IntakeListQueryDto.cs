namespace AGMS.Application.DTOs.Intake;

public class IntakeListQueryDto
{
    public string? MaintenanceType { get; set; }
    public string? CustomerName { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

