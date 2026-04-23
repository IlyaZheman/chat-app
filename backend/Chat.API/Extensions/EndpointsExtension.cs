using Chat.API.Endpoints;
using Chat.API.Hubs;

namespace Chat.API.Extensions;

public static class EndpointsExtension
{
    public static WebApplication MapApiEndpoints(this WebApplication app)
    {
        app.MapHub<ChatHub>("/chat").RequireAuthorization();

        var api = app.MapGroup("api");
        api.MapUsersEndpoints();
        api.MapChatsEndpoints();
        api.MapAdminEndpoints();
        api.MapTestEndpoints();

        return app;
    }
}