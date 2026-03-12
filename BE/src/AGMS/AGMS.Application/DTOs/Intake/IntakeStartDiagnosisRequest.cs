using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.Intake
{
    public class IntakeStartDiagnosisRequest
    {
        public int? PackageId { get; set; }

        [MaxLength(255)]
        public string? Note { get; set; }
    }
}
