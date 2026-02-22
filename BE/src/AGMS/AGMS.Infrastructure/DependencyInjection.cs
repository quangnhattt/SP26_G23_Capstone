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
        services.AddScoped<IUnitRepository, Repositories.UnitRepository>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IAuthTokenService, AuthTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IUnitService, UnitService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IMaintenancePackageService, MaintenancePackageService>();
        services.AddScoped<IUserService, UserService>();

        return services;
    }
}
