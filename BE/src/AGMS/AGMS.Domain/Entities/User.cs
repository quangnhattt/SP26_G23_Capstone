namespace AGMS.Domain.Entities;

public class User
{
    public int UserID { get; set; }
    public string UserCode { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? PasswordSalt { get; set; }
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Image { get; set; }
    public string? Gender { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public int RoleID { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public decimal TotalSpending { get; set; }
    public int? CurrentRankID { get; set; }
    public bool IsOnRescueMission { get; set; }
    public string? Skills { get; set; }

    public virtual ICollection<Appointment> AppointmentConfirmedByNavigations { get; set; } = new List<Appointment>();
    public virtual ICollection<Appointment> AppointmentCreatedByNavigations { get; set; } = new List<Appointment>();
    public virtual ICollection<CarMaintenance> CarMaintenanceAssignedTechnicians { get; set; } = new List<CarMaintenance>();
    public virtual ICollection<CarMaintenance> CarMaintenanceCreatedByNavigations { get; set; } = new List<CarMaintenance>();
    public virtual ICollection<Car> Cars { get; set; } = new List<Car>();
    public virtual MembershipRank? CurrentRank { get; set; }
    public virtual ICollection<MaintenanceMedium> MaintenanceMedia { get; set; } = new List<MaintenanceMedium>();
    public virtual ICollection<MaintenancePackage> MaintenancePackages { get; set; } = new List<MaintenancePackage>();
    public virtual ICollection<MaintenanceStatusLog> MaintenanceStatusLogs { get; set; } = new List<MaintenanceStatusLog>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
    public virtual ICollection<RescueRequest> RescueRequestAssignedTechnicians { get; set; } = new List<RescueRequest>();
    public virtual ICollection<RescueRequest> RescueRequestCustomers { get; set; } = new List<RescueRequest>();
    public virtual ICollection<RescueRequest> RescueRequestServiceAdvisors { get; set; } = new List<RescueRequest>();
    public virtual Role Role { get; set; } = null!;
    public virtual ICollection<ServiceBay> ServiceBays { get; set; } = new List<ServiceBay>();
    public virtual ICollection<ServiceEvaluation> ServiceEvaluations { get; set; } = new List<ServiceEvaluation>();
    public virtual ICollection<TokenForgetPassword> TokenForgetPasswords { get; set; } = new List<TokenForgetPassword>();
    public virtual ICollection<TransferOrder> TransferOrderApprovedByNavigations { get; set; } = new List<TransferOrder>();
    public virtual ICollection<TransferOrder> TransferOrderCreateByNavigations { get; set; } = new List<TransferOrder>();
    public virtual ICollection<WarrantyClaim> WarrantyClaims { get; set; } = new List<WarrantyClaim>();
}