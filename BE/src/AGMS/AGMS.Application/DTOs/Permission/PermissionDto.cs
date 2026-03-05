using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Permission
{
    public class PermissionCreateDto
    {
        [Required(ErrorMessage = "Tên quyền không được để trống")]
        [StringLength(100, ErrorMessage = "Tên quyền không vượt quá 100 ký tự")]
        public string Name { get; set; } = null!;

        [StringLength(255, ErrorMessage = "URL không vượt quá 255 ký tự")]
        public string? URL { get; set; }

        [StringLength(500, ErrorMessage = "Mô tả không vượt quá 500 ký tự")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Mã nhóm quyền (GroupID) là bắt buộc")]
        public int GroupID { get; set; }
    }

    public class PermissionUpdateDto : PermissionCreateDto
    {
        // Kế thừa toàn bộ thuộc tính từ PermissionCreateDto
    }
}