using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.Intake
{
    public class IntakeListItemDto
    {
        public int MaintenanceId { get; set; }
        public string CustomerName { get; set; } = null!;
        public string CarInfo { get; set; } = null!;
        public DateTime MaintenanceDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string MaintenanceType { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? TechnicianName { get; set; }
    }
}
