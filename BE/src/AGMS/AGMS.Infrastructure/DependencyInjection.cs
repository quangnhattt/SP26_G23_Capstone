using AGMS.Application;
using AGMS.Application.Contracts;
using AGMS.Infrastructure.Persistence.Db;
using AGMS.Infrastructure.Repositories;
using AGMS.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AGMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration["ConnectionStrings:MyCnn"]
            ?? throw new InvalidOperationException("ConnectionStrings:MyCnn is not configured.");

        services.AddDbContext<CarServiceDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IVerificationCodeRepository, VerificationCodeRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IMaintenancePackageRepository, MaintenancePackageRepository>();
        services.AddScoped<ICarMaintenanceRepository, CarMaintenanceRepository>();
        services.AddScoped<IUnitRepository, Repositories.UnitRepository>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IAuthTokenService, AuthTokenService>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IRepairRequestRepository, RepairRequestRepository>();
        services.AddScoped<IRepairRequestService, RepairRequestService>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IUnitService, UnitService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IMaintenancePackageService, MaintenancePackageService>();
        services.AddScoped<ICarMaintenanceService, CarMaintenanceService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISupplierRepository, SupplierRepository>();
        services.AddScoped<ISupplierService, SupplierService>();
        services.AddScoped<IMembershipRankRepository, MembershipRankRepository>();
        services.AddScoped<IMembershipRankService, MembershipRankService>();

        // Module cứu hộ (UC-RES-01 đến UC-RES-06)
        services.AddScoped<IRescueRequestRepository, RescueRequestRepository>();
        services.AddScoped<IRescueRequestService, RescueRequestService>();
        services.AddScoped<IRolePermissionService, RolePermissionService>();
        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IPermissionGroupService, PermissionGroupService>();
        return services;
    }
}
