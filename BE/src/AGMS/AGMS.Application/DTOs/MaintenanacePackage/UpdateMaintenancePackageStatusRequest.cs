using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.MaintenanacePackage;

public class UpdateMaintenancePackageStatusRequest
{
    [Required]
    public bool IsActive { get; set; }
}
