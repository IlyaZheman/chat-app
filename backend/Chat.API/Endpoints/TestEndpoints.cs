namespace Chat.API.Endpoints;

public static class TestEndpoints
{
    public static IEndpointRouteBuilder MapTestEndpoints(this IEndpointRouteBuilder builder)
    {
        var endpoints = builder.MapGroup("test");

        endpoints.MapGet(string.Empty, () => Results.Ok("test"));
        endpoints.MapPost(string.Empty, () => Results.Ok()).RequireAuthorization();

        return builder;
    }
}