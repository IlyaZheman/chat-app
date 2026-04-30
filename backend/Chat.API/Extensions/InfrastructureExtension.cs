using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Chat.API.Hubs;
using Chat.API.Middlewares;
using Chat.Application.Interfaces;
using Chat.Domain.Interfaces;
using Chat.Infrastructure.Cache;
using Chat.Infrastructure.Notifications;
using Chat.Infrastructure.Persistence;
using Chat.Infrastructure.Persistence.Repositories;
using Chat.Infrastructure.Security;
using Chat.Infrastructure.Storage;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

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

        var redisConn = configuration.GetConnectionString("Redis")
                        ?? throw new InvalidOperationException("Redis connection string is missing.");
        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(redisConn));
        services.AddStackExchangeRedisCache(options => options.Configuration = redisConn);

        services.AddCors(options =>
            options.AddDefaultPolicy(policy =>
            {
                var origin = configuration.GetConnectionString("Cors")
                             ?? throw new InvalidOperationException("Cors origin is missing.");
                policy.WithOrigins(origin)
                    .WithHeaders("Content-Type", "X-Requested-With")
                    .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
                    .AllowCredentials();
            }));

        services.AddRateLimiter(options =>
        {
            options.AddPolicy("login", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                    }));
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });

        var enumConverter = new JsonStringEnumConverter(JsonNamingPolicy.CamelCase);
        services.Configure<JsonOptions>(o =>
            o.SerializerOptions.Converters.Add(enumConverter));
        services.AddSignalR().AddJsonProtocol(o =>
            o.PayloadSerializerOptions.Converters.Add(enumConverter));

        services.AddScoped<IUsersRepository, UsersRepository>();
        services.AddScoped<IChatsRepository, ChatsRepository>();
        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IConnectionStorage, RedisConnectionStorage>();
        services.AddScoped<IOnlineStatusStorage, RedisOnlineStatusStorage>();

        services.AddSingleton<IOfflineDebouncer, OfflineDebouncer>();
        services.AddHostedService<OnlinePresenceHeartbeatService>();

        services.AddScoped<IChatNotifier, SignalRChatNotifier<ChatHub>>();

        services.Configure<FormOptions>(o =>
            o.MultipartBodyLengthLimit = 10 * 1024 * 1024 + 4096);

        var minioOptions = configuration.GetSection("Minio").Get<MinioOptions>()
                           ?? throw new InvalidOperationException("Minio configuration is missing.");
        services.Configure<MinioOptions>(configuration.GetSection("Minio"));
        services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(
            new BasicAWSCredentials(minioOptions.AccessKey, minioOptions.SecretKey),
            new AmazonS3Config
            {
                ServiceURL = minioOptions.ServiceUrl,
                ForcePathStyle = true,
                AuthenticationRegion = RegionEndpoint.USEast1.SystemName
            }));
        services.AddSingleton<IFileStorage, MinioFileStorage>();

        return services;
    }

    public static WebApplication UseInfrastructure(this WebApplication app)
    {
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseHttpsRedirection();

        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }

        app.UseCors();
        app.UseRateLimiter();
        app.UseCookiePolicy(new CookiePolicyOptions
        {
            MinimumSameSitePolicy = SameSiteMode.Strict,
            HttpOnly = HttpOnlyPolicy.Always,
            Secure = CookieSecurePolicy.Always
        });

        return app;
    }
}