namespace Chat.Endpoints;

public static class TestEndpoints
{
    public static IEndpointRouteBuilder MapTestEndpoints(this IEndpointRouteBuilder builder)
    {
        var endpoints = builder.MapGroup("test").RequireAuthorization();

        endpoints.MapPost(string.Empty, TestPost);
        endpoints.MapGet(string.Empty, TestGet);

        return endpoints;
    }

    private static async Task<IResult> TestPost()
    {
        return Results.Ok();
    }

    private static async Task<IResult> TestGet()
    {
        return Results.Ok("test");
    }
}