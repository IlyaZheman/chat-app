using Scalar.AspNetCore;

namespace Chat.API.Extensions;

public static class ApiDocsExtension
{
    public static IServiceCollection AddApiDocs(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        return services;
    }

    public static WebApplication UseApiDocs(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapSwagger("/openapi/{documentName}.json");
            app.MapScalarApiReference();
        }

        return app;
    }
}