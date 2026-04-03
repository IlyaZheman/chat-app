using Chat.Contracts.Users;
using Chat.Services;

namespace Chat.Endpoints;

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
        UsersService usersService)
    {
        await usersService.Register(request.UserName, request.Email, request.Password);

        return Results.Ok();
    }

    private static async Task<IResult> Login(
        LoginUserRequest request,
        UsersService usersService,
        HttpContext context)
    {
        var token = await usersService.Login(request.Email, request.Password);
        context.Response.Cookies.Append("AuthToken", token);

        return Results.Ok();
    }
}