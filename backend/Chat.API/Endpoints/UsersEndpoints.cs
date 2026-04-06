using Chat.API.Contracts.Users;
using Chat.Application.Users.Commands;
using Chat.Application.Users.Queries;

namespace Chat.API.Endpoints;

public static class UsersEndpoints
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder builder)
    {
        builder.MapPost("register", Register);
        builder.MapPost("login", Login);

        return builder;
    }

    private static async Task<IResult> Register(
        RegisterUserRequest request,
        RegisterUserHandler handler,
        CancellationToken ct)
    {
        await handler.HandleAsync(request.UserName, request.Email, request.Password, ct);
        return Results.Ok();
    }

    private static async Task<IResult> Login(
        LoginUserRequest request,
        LoginUserHandler handler,
        HttpContext context,
        CancellationToken ct)
    {
        var token = await handler.HandleAsync(request.Email, request.Password, ct);
        context.Response.Cookies.Append("AuthToken", token);
        return Results.Ok();
    }
}