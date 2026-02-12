using System;
using System.Collections.Generic;
using AGMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AGMS.Infrastructure.Persistence.Db;

public partial class CarServiceDbContext : DbContext
{
    public CarServiceDbContext(DbContextOptions<CarServiceDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Appointment> Appointments { get; set; }

    public virtual DbSet<AppointmentServiceItem> AppointmentServiceItems { get; set; }

    public virtual DbSet<Car> Cars { get; set; }

    public virtual DbSet<CarMaintenance> CarMaintenances { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<InventoryLotBalance> InventoryLotBalances { get; set; }

    public virtual DbSet<InventoryLot> InventoryLots { get; set; }

    public virtual DbSet<MaintenanceMedium> MaintenanceMedia { get; set; }

    public virtual DbSet<MaintenancePackage> MaintenancePackages { get; set; }

    public virtual DbSet<MaintenancePackageDetail> MaintenancePackageDetails { get; set; }

    public virtual DbSet<MaintenancePackageUsage> MaintenancePackageUsages { get; set; }

    public virtual DbSet<MaintenanceStatusLog> MaintenanceStatusLogs { get; set; }

    public virtual DbSet<MembershipRank> MembershipRanks { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<PaymentTransaction> PaymentTransactions { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    public virtual DbSet<PermissionGroup> PermissionGroups { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductItem> ProductItems { get; set; }

    public virtual DbSet<RescueRequest> RescueRequests { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<ServiceBay> ServiceBays { get; set; }

    public virtual DbSet<ServiceDetail> ServiceDetails { get; set; }

    public virtual DbSet<ServiceEvaluation> ServiceEvaluations { get; set; }

    public virtual DbSet<ServicePartDetail> ServicePartDetails { get; set; }

    public virtual DbSet<StockLot> StockLots { get; set; }

    public virtual DbSet<Supplier> Suppliers { get; set; }

    public virtual DbSet<SupplierProduct> SupplierProducts { get; set; }

    public virtual DbSet<TokenForgetPassword> TokenForgetPasswords { get; set; }

    public virtual DbSet<TransferOrder> TransferOrders { get; set; }

    public virtual DbSet<Unit> Units { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<VerificationCode> VerificationCodes { get; set; }

    public virtual DbSet<WarrantyClaim> WarrantyClaims { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.AppointmentID).HasName("PK__Appointm__8ECDFCA2BD68BF01");

            entity.HasIndex(e => new { e.CarID, e.AppointmentDate }, "IX_Appointments_CarDate");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("PENDING");

            entity.HasOne(d => d.Car).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.CarID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_Car");

            entity.HasOne(d => d.ConfirmedByNavigation).WithMany(p => p.AppointmentConfirmedByNavigations)
                .HasForeignKey(d => d.ConfirmedBy)
                .HasConstraintName("FK_Appointments_ConfirmedBy");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.AppointmentCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_CreatedBy");

            entity.HasOne(d => d.RequestedPackage).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.RequestedPackageID)
                .HasConstraintName("FK_Appointments_Package");
        });

        modelBuilder.Entity<AppointmentServiceItem>(entity =>
        {
            entity.HasKey(e => new { e.AppointmentID, e.ProductID }).HasName("PK__Appointm__458D30CCC31EE0AA");

            entity.Property(e => e.Notes).HasMaxLength(255);
            entity.Property(e => e.Quantity)
                .HasDefaultValue(1m)
                .HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Appointment).WithMany(p => p.AppointmentServiceItems)
                .HasForeignKey(d => d.AppointmentID)
                .HasConstraintName("FK_ApptItem_Appt");

            entity.HasOne(d => d.Product).WithMany(p => p.AppointmentServiceItems)
                .HasForeignKey(d => d.ProductID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ApptItem_Product");
        });

        modelBuilder.Entity<Car>(entity =>
        {
            entity.HasKey(e => e.CarID).HasName("PK__Cars__68A0340ECE84EF57");

            entity.HasIndex(e => e.LicensePlate, "UQ_Cars_LicensePlate").IsUnique();

            entity.Property(e => e.Brand).HasMaxLength(50);
            entity.Property(e => e.ChassisNumber).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(30);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.EngineNumber).HasMaxLength(50);
            entity.Property(e => e.LicensePlate).HasMaxLength(20);
            entity.Property(e => e.Model).HasMaxLength(50);

            entity.HasOne(d => d.Owner).WithMany(p => p.Cars)
                .HasForeignKey(d => d.OwnerID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Cars_Owner");
        });

        modelBuilder.Entity<CarMaintenance>(entity =>
        {
            entity.HasKey(e => e.MaintenanceID).HasName("PK__CarMaint__E60542B5D2FC20A2");

            entity.ToTable("CarMaintenance");

            entity.HasIndex(e => new { e.CarID, e.Status }, "IX_RO_CarStatus");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.FinalAmount)
                .HasComputedColumnSql("(([TotalAmount]-[DiscountAmount])-[MemberDiscountAmount])", true)
                .HasColumnType("decimal(20, 2)");
            entity.Property(e => e.MaintenanceDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.MaintenanceType)
                .HasMaxLength(20)
                .HasDefaultValue("REGULAR");
            entity.Property(e => e.MemberDiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MemberDiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.RankAtTimeOfService).HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("WAITING");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Appointment).WithMany(p => p.CarMaintenances)
                .HasForeignKey(d => d.AppointmentID)
                .HasConstraintName("FK_RO_Appt");

            entity.HasOne(d => d.AssignedTechnician).WithMany(p => p.CarMaintenanceAssignedTechnicians)
                .HasForeignKey(d => d.AssignedTechnicianID)
                .HasConstraintName("FK_RO_Tech");

            entity.HasOne(d => d.Bay).WithMany(p => p.CarMaintenances)
                .HasForeignKey(d => d.BayID)
                .HasConstraintName("FK_RO_Bay");

            entity.HasOne(d => d.Car).WithMany(p => p.CarMaintenances)
                .HasForeignKey(d => d.CarID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RO_Car");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.CarMaintenanceCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RO_CreatedBy");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryID).HasName("PK__Category__19093A2B0177B389");

            entity.ToTable("Category");

            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Type).HasMaxLength(20);
        });

        modelBuilder.Entity<InventoryLotBalance>(entity =>
        {
            entity.HasKey(e => e.LotID).HasName("PK__Inventor__4160EF4D500AC4C5");

            entity.ToTable("InventoryLotBalance");

            entity.Property(e => e.LotID).ValueGeneratedNever();
            entity.Property(e => e.LastUpdated).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Lot).WithOne(p => p.InventoryLotBalance)
                .HasForeignKey<InventoryLotBalance>(d => d.LotID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Bal_Lot");
        });

        modelBuilder.Entity<InventoryLot>(entity =>
        {
            entity.HasKey(e => new { e.TransferOrderID, e.LotID }).HasName("PK__Inventor__8EFA4B1A79E6592C");

            entity.ToTable("Inventory_Lot");

            entity.HasIndex(e => e.TransferOrderID, "IX_InventoryLot_TO");

            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("ACTIVE");

            entity.HasOne(d => d.Lot).WithMany(p => p.InventoryLots)
                .HasForeignKey(d => d.LotID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_IL_Lot");

            entity.HasOne(d => d.TransferOrder).WithMany(p => p.InventoryLots)
                .HasForeignKey(d => d.TransferOrderID)
                .HasConstraintName("FK_IL_TO");
        });

        modelBuilder.Entity<MaintenanceMedium>(entity =>
        {
            entity.HasKey(e => e.MediaID).HasName("PK__Maintena__B2C2B5AF1F9E1C0F");

            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.UploadedDate).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Maintenance).WithMany(p => p.MaintenanceMedia)
                .HasForeignKey(d => d.MaintenanceID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Media_Maintenance");

            entity.HasOne(d => d.UploadedByNavigation).WithMany(p => p.MaintenanceMedia)
                .HasForeignKey(d => d.UploadedBy)
                .HasConstraintName("FK_Media_Uploader");
        });

        modelBuilder.Entity<MaintenancePackage>(entity =>
        {
            entity.HasKey(e => e.PackageID).HasName("PK__Maintena__322035ECDDAAA570");

            entity.ToTable("MaintenancePackage");

            entity.HasIndex(e => e.PackageCode, "UQ__Maintena__9418542939835C75").IsUnique();

            entity.Property(e => e.ApplicableBrands).HasMaxLength(500);
            entity.Property(e => e.BasePrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.EstimatedDurationHours).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.FinalPrice)
                .HasComputedColumnSql("([BasePrice]*((1)-[DiscountPercent]/(100.0)))", true)
                .HasColumnType("numeric(31, 9)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.PackageCode).HasMaxLength(50);

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.MaintenancePackages)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_Package_CreatedBy");
        });

        modelBuilder.Entity<MaintenancePackageDetail>(entity =>
        {
            entity.HasKey(e => e.PackageDetailID).HasName("PK__Maintena__A7D8258A2F4FBFF0");

            entity.ToTable("MaintenancePackageDetail");

            entity.HasIndex(e => new { e.PackageID, e.ProductID }, "UX_MPackageDetail").IsUnique();

            entity.Property(e => e.IsRequired).HasDefaultValue(true);
            entity.Property(e => e.Notes).HasMaxLength(255);
            entity.Property(e => e.Quantity)
                .HasDefaultValue(1m)
                .HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Package).WithMany(p => p.MaintenancePackageDetails)
                .HasForeignKey(d => d.PackageID)
                .HasConstraintName("FK_PackageDetail_Package");

            entity.HasOne(d => d.Product).WithMany(p => p.MaintenancePackageDetails)
                .HasForeignKey(d => d.ProductID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PackageDetail_Product");
        });

        modelBuilder.Entity<MaintenancePackageUsage>(entity =>
        {
            entity.HasKey(e => e.UsageID).HasName("PK__Maintena__29B197C0FF782C3C");

            entity.ToTable("MaintenancePackageUsage");

            entity.Property(e => e.AppliedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.AppliedPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Maintenance).WithMany(p => p.MaintenancePackageUsages)
                .HasForeignKey(d => d.MaintenanceID)
                .HasConstraintName("FK_Usage_Maintenance");

            entity.HasOne(d => d.Package).WithMany(p => p.MaintenancePackageUsages)
                .HasForeignKey(d => d.PackageID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Usage_Package");
        });

        modelBuilder.Entity<MaintenanceStatusLog>(entity =>
        {
            entity.HasKey(e => e.LogID).HasName("PK__Maintena__5E5499A804DE325A");

            entity.ToTable("MaintenanceStatusLog");

            entity.Property(e => e.ChangedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.NewStatus).HasMaxLength(30);
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.OldStatus).HasMaxLength(30);

            entity.HasOne(d => d.ChangedByNavigation).WithMany(p => p.MaintenanceStatusLogs)
                .HasForeignKey(d => d.ChangedBy)
                .HasConstraintName("FK_StatusLog_User");

            entity.HasOne(d => d.Maintenance).WithMany(p => p.MaintenanceStatusLogs)
                .HasForeignKey(d => d.MaintenanceID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StatusLog_Maintenance");
        });

        modelBuilder.Entity<MembershipRank>(entity =>
        {
            entity.HasKey(e => e.RankID).HasName("PK__Membersh__B37AFB9608E5E1C6");

            entity.ToTable("MembershipRank");

            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MinSpending).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RankName).HasMaxLength(50);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationID).HasName("PK__Notifica__20CF2E3299AFE616");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Type).HasMaxLength(50);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_User");
        });

        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasKey(e => e.TransactionID).HasName("PK__PaymentT__55433A4BA0BF5A02");

            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Notes).HasMaxLength(255);
            entity.Property(e => e.PaymentDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.PaymentMethod).HasMaxLength(20);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("PENDING");
            entity.Property(e => e.TransactionReference).HasMaxLength(100);

            entity.HasOne(d => d.Maintenance).WithMany(p => p.PaymentTransactions)
                .HasForeignKey(d => d.MaintenanceID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payment_Maintenance");

            entity.HasOne(d => d.ProcessedByNavigation).WithMany(p => p.PaymentTransactions)
                .HasForeignKey(d => d.ProcessedBy)
                .HasConstraintName("FK_Payment_ProcessedBy");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.PermissionID).HasName("PK__Permissi__EFA6FB0F3AF0D213");

            entity.ToTable("Permission");

            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.URL)
                .HasMaxLength(255)
                .IsUnicode(false);

            entity.HasOne(d => d.Group).WithMany(p => p.Permissions)
                .HasForeignKey(d => d.GroupID)
                .HasConstraintName("FK_Permission_Group");
        });

        modelBuilder.Entity<PermissionGroup>(entity =>
        {
            entity.HasKey(e => e.GroupID).HasName("PK__Permissi__149AF30A47DCA7AB");

            entity.ToTable("PermissionGroup");

            entity.HasIndex(e => e.GroupName, "UQ__Permissi__6EFCD4346419D647").IsUnique();

            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.GroupName).HasMaxLength(100);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductID).HasName("PK__Product__B40CC6ED21455FAD");

            entity.ToTable("Product");

            entity.HasIndex(e => e.Code, "UQ__Product__A25C5AA7EC5C7E19").IsUnique();

            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.EstimatedDurationHours).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Type).HasMaxLength(20);

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryID)
                .HasConstraintName("FK_Product_Category");

            entity.HasOne(d => d.Unit).WithMany(p => p.Products)
                .HasForeignKey(d => d.UnitID)
                .HasConstraintName("FK_Product_Unit");
        });

        modelBuilder.Entity<ProductItem>(entity =>
        {
            entity.HasKey(e => e.ProductItemID).HasName("PK__ProductI__1373AD20C27C0679");
            entity.ToTable("ProductItems");
            entity.Property(e => e.SerialNumber).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.HasOne(d => d.Product).WithMany(p => p.ProductItems)
                .HasForeignKey(d => d.ProductID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ProductItems_Product");
        });

        modelBuilder.Entity<RescueRequest>(entity =>
        {
            entity.HasKey(e => e.RescueID).HasName("PK__RescueRe__4ABD1D6053ABA5F9");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CurrentAddress).HasMaxLength(500);
            entity.Property(e => e.Latitude).HasColumnType("decimal(18, 8)");
            entity.Property(e => e.Longitude).HasColumnType("decimal(18, 8)");
            entity.Property(e => e.RescueType).HasMaxLength(50);
            entity.Property(e => e.ServiceFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("PENDING");

            entity.HasOne(d => d.AssignedTechnician).WithMany(p => p.RescueRequestAssignedTechnicians)
                .HasForeignKey(d => d.AssignedTechnicianID)
                .HasConstraintName("FK_Rescue_Tech");

            entity.HasOne(d => d.Car).WithMany(p => p.RescueRequests)
                .HasForeignKey(d => d.CarID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Rescue_Car");

            entity.HasOne(d => d.Customer).WithMany(p => p.RescueRequestCustomers)
                .HasForeignKey(d => d.CustomerID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Rescue_Customer");

            entity.HasOne(d => d.ResultingMaintenance).WithMany(p => p.RescueRequests)
                .HasForeignKey(d => d.ResultingMaintenanceID)
                .HasConstraintName("FK_Rescue_ResultMaintenance");

            entity.HasOne(d => d.ServiceAdvisor).WithMany(p => p.RescueRequestServiceAdvisors)
                .HasForeignKey(d => d.ServiceAdvisorID)
                .HasConstraintName("FK_Rescue_SA");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleID).HasName("PK__Role__8AFACE3A8E0D6ED7");

            entity.ToTable("Role");

            entity.HasIndex(e => e.RoleName, "UQ__Role__8A2B616068E23DD2").IsUnique();

            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.RoleName).HasMaxLength(50);

            entity.HasMany(d => d.Permissions).WithMany(p => p.Roles)
                .UsingEntity<Dictionary<string, object>>(
                    "RolePermission",
                    r => r.HasOne<Permission>().WithMany()
                        .HasForeignKey("PermissionID")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_RolePermission_Permission"),
                    l => l.HasOne<Role>().WithMany()
                        .HasForeignKey("RoleID")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_RolePermission_Role"),
                    j =>
                    {
                        j.HasKey("RoleID", "PermissionID").HasName("PK__RolePerm__6400A18AABDA3C98");
                        j.ToTable("RolePermission");
                    });
        });

        modelBuilder.Entity<ServiceBay>(entity =>
        {
            entity.HasKey(e => e.BayID).HasName("PK__ServiceB__21F50E8B653BCDE4");

            entity.Property(e => e.BayName).HasMaxLength(50);
            entity.Property(e => e.BayType).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaintenanceNote).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("AVAILABLE");

            entity.HasOne(d => d.AssignedTechnician).WithMany(p => p.ServiceBays)
                .HasForeignKey(d => d.AssignedTechnicianID)
                .HasConstraintName("FK_ServiceBays_Tech");
        });

        modelBuilder.Entity<ServiceDetail>(entity =>
        {
            entity.HasKey(e => e.ServiceDetailID).HasName("PK__ServiceD__6F80952C38442290");

            entity.HasIndex(e => e.MaintenanceID, "IX_ServiceDetails_Maintenance");

            entity.Property(e => e.ItemStatus)
                .HasMaxLength(20)
                .HasDefaultValue("APPROVED");
            entity.Property(e => e.Notes).HasMaxLength(255);
            entity.Property(e => e.Quantity)
                .HasDefaultValue(1m)
                .HasColumnType("decimal(10, 2)");
            entity.Property(e => e.TotalPrice)
                .HasComputedColumnSql("([Quantity]*[UnitPrice])", true)
                .HasColumnType("decimal(29, 4)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Maintenance).WithMany(p => p.ServiceDetails)
                .HasForeignKey(d => d.MaintenanceID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Svc_Maintenance");

            entity.HasOne(d => d.Package).WithMany(p => p.ServiceDetails)
                .HasForeignKey(d => d.PackageID)
                .HasConstraintName("FK_Svc_Package");

            entity.HasOne(d => d.Product).WithMany(p => p.ServiceDetails)
                .HasForeignKey(d => d.ProductID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Svc_Product");
        });

        modelBuilder.Entity<ServiceEvaluation>(entity =>
        {
            entity.HasKey(e => e.EvaluationID).HasName("PK__ServiceE__36AE68D332289D6D");

            entity.Property(e => e.Comments).HasMaxLength(1000);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Customer).WithMany(p => p.ServiceEvaluations)
                .HasForeignKey(d => d.CustomerID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Eval_Customer");

            entity.HasOne(d => d.Maintenance).WithMany(p => p.ServiceEvaluations)
                .HasForeignKey(d => d.MaintenanceID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Eval_Maintenance");
        });

        modelBuilder.Entity<ServicePartDetail>(entity =>
        {
            entity.HasKey(e => e.ServicePartDetailID).HasName("PK__ServiceP__82EC177AFF0B53C1");

            entity.HasIndex(e => e.MaintenanceID, "IX_ServicePartDetails_Maintenance");

            entity.Property(e => e.InventoryStatus)
                .HasMaxLength(20)
                .HasDefaultValue("PENDING");
            entity.Property(e => e.ItemStatus)
                .HasMaxLength(20)
                .HasDefaultValue("APPROVED");
            entity.Property(e => e.Notes).HasMaxLength(255);
            entity.Property(e => e.TotalPrice)
                .HasComputedColumnSql("(CONVERT([decimal](18,2),[Quantity])*[UnitPrice])", true)
                .HasColumnType("decimal(37, 4)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.IssuedTransferOrder).WithMany(p => p.ServicePartDetailIssuedTransferOrders)
                .HasForeignKey(d => d.IssuedTransferOrderID)
                .HasConstraintName("FK_Part_IssuedTO");

            entity.HasOne(d => d.Lot).WithMany(p => p.ServicePartDetails)
                .HasForeignKey(d => d.LotID)
                .HasConstraintName("FK_Part_Lot");

            entity.HasOne(d => d.Maintenance).WithMany(p => p.ServicePartDetails)
                .HasForeignKey(d => d.MaintenanceID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Part_Maintenance");

            entity.HasOne(d => d.Package).WithMany(p => p.ServicePartDetails)
                .HasForeignKey(d => d.PackageID)
                .HasConstraintName("FK_Part_Package");

            entity.HasOne(d => d.Product).WithMany(p => p.ServicePartDetails)
                .HasForeignKey(d => d.ProductID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Part_Product");

            entity.HasOne(d => d.ReservedTransferOrder).WithMany(p => p.ServicePartDetailReservedTransferOrders)
                .HasForeignKey(d => d.ReservedTransferOrderID)
                .HasConstraintName("FK_Part_ReservedTO");
        });

        modelBuilder.Entity<StockLot>(entity =>
        {
            entity.HasKey(e => e.LotID).HasName("PK__StockLot__4160EF4D8A779128");

            entity.ToTable("StockLot");

            entity.HasIndex(e => e.ProductID, "IX_StockLot_Product");

            entity.HasIndex(e => new { e.ProductID, e.LotNumber }, "UX_StockLot").IsUnique();

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.LotNumber).HasMaxLength(100);
            entity.Property(e => e.UnitCost).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Product).WithMany(p => p.StockLots)
                .HasForeignKey(d => d.ProductID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StockLot_Product");
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.SupplierID).HasName("PK__Supplier__4BE6669490F0DD0B");

            entity.ToTable("Supplier");

            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        modelBuilder.Entity<SupplierProduct>(entity =>
        {
            entity.HasKey(e => new { e.SupplierID, e.ProductID }).HasName("PK__Supplier__80A6AAFA87294381");

            entity.ToTable("Supplier_Product");

            entity.Property(e => e.EstimatedPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Policies).HasMaxLength(500);

            entity.HasOne(d => d.Product).WithMany(p => p.SupplierProducts)
                .HasForeignKey(d => d.ProductID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SupplierProduct_Product");

            entity.HasOne(d => d.Supplier).WithMany(p => p.SupplierProducts)
                .HasForeignKey(d => d.SupplierID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SupplierProduct_Supplier");
        });

        modelBuilder.Entity<TokenForgetPassword>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TokenFor__3214EC078610F318");

            entity.ToTable("TokenForgetPassword");

            entity.HasIndex(e => e.Token, "UQ__TokenFor__1EB4F8174B3CF600").IsUnique();

            entity.Property(e => e.Token)
                .HasMaxLength(255)
                .IsUnicode(false);

            entity.HasOne(d => d.User).WithMany(p => p.TokenForgetPasswords)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_TokenFP_User");
        });

        modelBuilder.Entity<TransferOrder>(entity =>
        {
            entity.HasKey(e => e.TransferOrderID).HasName("PK__Transfer__4AEC45EE1A3496E1");

            entity.ToTable("Transfer_Order");

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DocumentDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("DRAFT");
            entity.Property(e => e.Type).HasMaxLength(30);

            entity.HasOne(d => d.ApprovedByNavigation).WithMany(p => p.TransferOrderApprovedByNavigations)
                .HasForeignKey(d => d.ApprovedBy)
                .HasConstraintName("FK_TO_ApprovedBy");

            entity.HasOne(d => d.CreateByNavigation).WithMany(p => p.TransferOrderCreateByNavigations)
                .HasForeignKey(d => d.CreateBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TO_CreateBy");

            entity.HasOne(d => d.RelatedMaintenance).WithMany(p => p.TransferOrders)
                .HasForeignKey(d => d.RelatedMaintenanceID)
                .HasConstraintName("FK_TO_Maintenance");

            entity.HasOne(d => d.Supplier).WithMany(p => p.TransferOrders)
                .HasForeignKey(d => d.SupplierID)
                .HasConstraintName("FK_TO_Supplier");
        });

        modelBuilder.Entity<Unit>(entity =>
        {
            entity.HasKey(e => e.UnitID).HasName("PK__Unit__44F5EC95B076260C");

            entity.ToTable("Unit");

            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Type).HasMaxLength(50);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserID).HasName("PK__Users__1788CCACF933880C");

            entity.HasIndex(e => e.Email, "UQ_Users_Email").IsUnique();

            entity.HasIndex(e => e.UserCode, "UQ_Users_UserCode").IsUnique();

            entity.HasIndex(e => e.Username, "UQ_Users_Username").IsUnique();

            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.Gender)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.PasswordSalt).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Skills).HasMaxLength(500);
            entity.Property(e => e.TotalSpending).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UserCode).HasMaxLength(20);
            entity.Property(e => e.Username).HasMaxLength(50);

            entity.HasOne(d => d.CurrentRank).WithMany(p => p.Users)
                .HasForeignKey(d => d.CurrentRankID)
                .HasConstraintName("FK_Users_Rank");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Users_Role");
        });

        modelBuilder.Entity<VerificationCode>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Verifica__3214EC076C8E0978");

            entity.Property(e => e.Code).HasMaxLength(10);
            entity.Property(e => e.ContactInfo).HasMaxLength(100);
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasDefaultValue("REGISTER");
        });

        modelBuilder.Entity<WarrantyClaim>(entity =>
        {
            entity.HasKey(e => e.ClaimID).HasName("PK__Warranty__EF2E13BB013C0BAD");

            entity.Property(e => e.ClaimDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("PENDING");

            entity.HasOne(d => d.Advisor).WithMany(p => p.WarrantyClaims)
                .HasForeignKey(d => d.AdvisorID)
                .HasConstraintName("FK_WC_Advisor");

            entity.HasOne(d => d.Car).WithMany(p => p.WarrantyClaims)
                .HasForeignKey(d => d.CarID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WC_Car");

            entity.HasOne(d => d.OriginalMaintenance).WithMany(p => p.WarrantyClaimOriginalMaintenances)
                .HasForeignKey(d => d.OriginalMaintenanceID)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WC_OriginalMaintenance");

            entity.HasOne(d => d.OriginalServiceDetail).WithMany(p => p.WarrantyClaims)
                .HasForeignKey(d => d.OriginalServiceDetailID)
                .HasConstraintName("FK_WC_ServiceDetail");

            entity.HasOne(d => d.OriginalServicePartDetail).WithMany(p => p.WarrantyClaims)
                .HasForeignKey(d => d.OriginalServicePartDetailID)
                .HasConstraintName("FK_WC_ServicePartDetail");

            entity.HasOne(d => d.ResultingMaintenance).WithMany(p => p.WarrantyClaimResultingMaintenances)
                .HasForeignKey(d => d.ResultingMaintenanceID)
                .HasConstraintName("FK_WC_ResultingMaintenance");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
