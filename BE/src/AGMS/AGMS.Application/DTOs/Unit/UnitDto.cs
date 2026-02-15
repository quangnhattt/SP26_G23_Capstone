using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.Unit
{
    public class UnitDto
    {
        public int UnitID { get; set; }
        public string Name { get; set; } = null!;
        public string? Type { get; set; }
        public string? Description { get; set; }
    }
}