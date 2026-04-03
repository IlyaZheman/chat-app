using Chat.Endpoints;
using Chat.Hubs;

namespace Chat.Extensions;

public static class EndpointsExtension
{
    public static WebApplication MapApiEndpoints(this WebApplication app)
    {
        app.MapHub<ChatHub>("/chat");

        var api = app.MapGroup("api");
        api.MapUsersEndpoints();
        api.MapTestEndpoints();

        return app;
    }
}