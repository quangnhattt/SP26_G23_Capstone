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
        public bool IsActive { get; set; }
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public string? SystemMessage { get; set; }
    }
}