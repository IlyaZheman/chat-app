using Chat.Middlewares;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Chat.Extensions;

public static class InfrastructureExtension
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddTransient<ExceptionMiddleware>();

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString(nameof(AppDbContext)));
        });

        services.AddStackExchangeRedisCache(options =>
        {
            var connection = configuration.GetConnectionString("Redis") ?? throw new ArgumentNullException();
            options.Configuration = connection;
        });

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                var origin = configuration.GetConnectionString("Cors") ?? throw new ArgumentNullException();
                policy.WithOrigins(origin)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        services.AddSignalR();

        return services;
    }

    public static WebApplication UseInfrastructure(this WebApplication app)
    {
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseHttpsRedirection();
        app.UseCors();
        app.UseCookiePolicy(new CookiePolicyOptions
        {
            MinimumSameSitePolicy = SameSiteMode.Strict,
            HttpOnly = HttpOnlyPolicy.Always,
            Secure = CookieSecurePolicy.Always
        });

        return app;
    }
}