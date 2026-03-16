
using System.ComponentModel.DataAnnotations;


namespace AGMS.Application.DTOs.ServiceOrder
{

    public class ProposeAdditionalItemsRequest
    {
        public List<ProposeServiceItemDto> Services { get; set; } = new();
        public List<ProposePartItemDto> Parts { get; set; } = new();
    }
    public class ProposeServiceItemDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required, Range(0.01, double.MaxValue)]
        public decimal Quantity { get; set; }
        [MaxLength(500)]
        public string? Notes { get; set; }
    }
    public class ProposePartItemDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required, Range(1, int.MaxValue)]
        public int Quantity { get; set; }
        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class AdditionalItemsDto
    {
        public List<AdditionalServiceItemDto> Services { get; set; } = new();
        public List<AdditionalPartItemDto>    Parts    { get; set; } = new();
    }
    public class AdditionalServiceItemDto
    {
        public int ServiceDetailId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Notes { get; set; }
        public string ItemStatus { get; set; } = string.Empty;
    }

    public class AdditionalPartItemDto
    {
        public int ServicePartDetailId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Notes { get; set; }
        public string ItemStatus { get; set; } = string.Empty;
    }
    public class RespondAdditionalItemsRequest
    {
        [Required, MinLength(1)]
        public List<RespondItemDto> Items { get; set; } = new();
    }

    public class RespondItemDto
    {
        [Required]
        public string Type { get; set; } = string.Empty;
        [Required]
        public int ItemId { get; set; }
        [Required]
        public bool Approved { get; set; }
    }


}