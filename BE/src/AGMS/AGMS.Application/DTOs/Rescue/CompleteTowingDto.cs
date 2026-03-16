using System.ComponentModel.DataAnnotations;

namespace AGMS.Application.DTOs.Rescue;

/// <summary>
/// DTO SA hoàn tất kéo xe và tạo Repair Order (UC-RES-03 C3).
/// Actor: SA — BR-19 (tạo CarMaintenance RESCUE_TOWING), BR-18 (TOWING_ACCEPTED → TOWED). SMC07.
/// </summary>
public class CompleteTowingDto
{
    /// <summary>Ghi chú cho Repair Order được tạo (lưu vào CarMaintenance.Notes). Max 500 ký tự.</summary>
    [MaxLength(500, ErrorMessage = "RepairOrderNotes không được vượt quá 500 ký tự.")]
    public string? RepairOrderNotes { get; set; }
}
