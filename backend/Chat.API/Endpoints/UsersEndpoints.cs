using System.Security.Claims;
using Chat.API.Contracts.Users;
using Chat.Application.Auth.Login;
using Chat.Application.Auth.Register;

namespace Chat.API.Endpoints;

public static class UsersEndpoints
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder builder)
    {
        builder.MapPost("register", Register);
        builder.MapPost("login", Login);
        builder.MapGet("me", Me).RequireAuthorization();

        return builder;
    }

    private static async Task<IResult> Register(
        RegisterUserRequest request,
        RegisterUserHandler handler,
        CancellationToken ct)
    {
        await handler.HandleAsync(new RegisterUserCommand(request.UserName, request.Email, request.Password), ct);
        return Results.Ok();
    }

    private static async Task<IResult> Login(
        LoginUserRequest request,
        LoginUserHandler handler,
        HttpContext context,
        CancellationToken ct)
    {
        var token = await handler.HandleAsync(new LoginUserQuery(request.Email, request.Password), ct);
        context.Response.Cookies.Append("AuthToken", token);
        return Results.Ok();
    }

    private static IResult Me(ClaimsPrincipal user)
    {
        var userId = user.FindFirstValue("userId") ?? throw new UnauthorizedAccessException();
        var userName = user.FindFirstValue("userName") ?? throw new UnauthorizedAccessException();

        return Results.Ok(new { userId, userName });
    }
}