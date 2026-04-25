using Chat.API.Hubs;
using Chat.API.Middlewares;
using Chat.Application.Interfaces;
using Chat.Domain.Interfaces;
using Chat.Infrastructure.Cache;
using Chat.Infrastructure.Notifications;
using Chat.Infrastructure.Persistence;
using Chat.Infrastructure.Persistence.Repositories;
using Chat.Infrastructure.Security;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;

namespace Chat.API.Extensions;

public static class InfrastructureExtension
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddTransient<ExceptionMiddleware>();

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString(nameof(AppDbContext))));

        services.AddStackExchangeRedisCache(options =>
            options.Configuration = configuration.GetConnectionString("Redis")
                ?? throw new InvalidOperationException("Redis connection string is missing."));

        services.AddCors(options =>
            options.AddDefaultPolicy(policy =>
            {
                var origin = configuration.GetConnectionString("Cors")
                    ?? throw new InvalidOperationException("Cors origin is missing.");
                policy.WithOrigins(origin)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }));

        services.AddSignalR();

        services.AddScoped<IUsersRepository, UsersRepository>();
        services.AddScoped<IChatsRepository, ChatsRepository>();
        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IConnectionStorage, RedisConnectionStorage>();

        services.AddScoped<IChatNotifier, SignalRChatNotifier<ChatHub>>();

        services.Configure<FormOptions>(o =>
            o.MultipartBodyLengthLimit = 10 * 1024 * 1024 + 4096);

        return services;
    }

    public static WebApplication UseInfrastructure(this WebApplication app)
    {
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseHttpsRedirection();
        app.UseStaticFiles();
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