using Chat.Services;
using Chat.Utilities;
using Chat.Utilities.Jwt;
using Persistence;
using Persistence.Repositories;

namespace Chat.Extensions;

public static class ApplicationExtension
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<JwtProvider>();
        services.AddScoped<PasswordHasher>();

        services.AddScoped<UsersRepository>();

        services.AddScoped<UsersService>();

        services.AddAutoMapper(cfg => cfg.AddProfile<DataBaseMappings>());

        return services;
    }
}