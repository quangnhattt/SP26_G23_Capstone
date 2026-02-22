using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Unit
{
    public class CreateUnitRequest
    {
        // Yêu cầu bắt buộc nhập Name, tự động văng MSG_UNIT05 nếu để trống
        [Required(ErrorMessage = "MSG_UNIT05: Required fields missing (Name)")]
        [StringLength(100, ErrorMessage = "Tên đơn vị không được vượt quá 100 ký tự")]
        public string Name { get; set; } = null!;

        // Garage cần phân loại là PART (Phụ tùng) hoặc SERVICE (Dịch vụ)
        [Required(ErrorMessage = "MSG_UNIT05: Required fields missing (Type)")]
        public string Type { get; set; } = null!;

        public string? Description { get; set; }
    }
}