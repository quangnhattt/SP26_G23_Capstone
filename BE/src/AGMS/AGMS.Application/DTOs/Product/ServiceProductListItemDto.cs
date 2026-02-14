using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGMS.Application.DTOs.Product
{
    public class ServiceProductListItemDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = null;
        public string Name { get; set; } = null;
        public decimal Price { get; set; }
        public string? Unit { get; set; }
        public string? Category { get; set; }
        public decimal? EstimatedDurationHours {  get; set; }
        public string? Description { get; set; }
        public string? Image { get; set; }
        public bool IsActive {  get; set; }
    }
}
