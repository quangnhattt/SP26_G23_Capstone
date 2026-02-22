using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Unit
{
    public class UpdateUnitRequest
    {
        // Validation phục vụ AF-02: Missing required fields
        [Required(ErrorMessage = "MSG_UNIT05: Required fields missing (Name)")]
        [StringLength(100, ErrorMessage = "Tên đơn vị không được vượt quá 100 ký tự")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "MSG_UNIT05: Required fields missing (Type)")]
        public string Type { get; set; } = null!;

        public string? Description { get; set; }
    }
}