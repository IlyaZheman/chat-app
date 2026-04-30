using System.Security.Claims;
using Chat.API.Contracts.Users;
using Chat.API.Extensions;
using Chat.Application.Admin;
using Chat.Application.Auth;
using Chat.Application.Auth.Login;
using Chat.Application.Auth.Register;
using Chat.Domain.Interfaces;
using Chat.Infrastructure.Security;
using Microsoft.Extensions.Options;

namespace Chat.API.Endpoints;

public static class UsersEndpoints
{
    private const string AuthCookieName = "AuthToken";

    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder builder)
    {
        builder.MapPost("register", Register);
        builder.MapPost("login", Login).RequireRateLimiting("login");
        builder.MapPost("logout", Logout);
        builder.MapGet("me", Me).RequireAuthorization();
        builder.MapPatch("me", UpdateProfile).RequireAuthorization();
        builder.MapGet("users", GetUsers).RequireAuthorization();

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
        IOptions<JwtOptions> jwtOptions,
        HttpContext context,
        CancellationToken ct)
    {
        var token = await handler.HandleAsync(new LoginUserQuery(request.Email, request.Password), ct);
        context.Response.Cookies.Append(AuthCookieName, token, BuildAuthCookieOptions(jwtOptions.Value));
        return Results.Ok();
    }

    private static IResult Logout(HttpContext context)
    {
        context.Response.Cookies.Delete(AuthCookieName, new CookieOptions
        {
            Path = "/",
            Secure = true,
            HttpOnly = true,
            SameSite = SameSiteMode.Strict
        });
        return Results.NoContent();
    }

    private static CookieOptions BuildAuthCookieOptions(JwtOptions options) => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Path = "/",
        Expires = DateTimeOffset.UtcNow.AddHours(options.ExpiresHours)
    };

    private static async Task<IResult> Me(
        ClaimsPrincipal user,
        IUsersRepository usersRepository,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        var dbUser = await usersRepository.GetByIdAsync(userId, ct);
        if (dbUser is null) return Results.Unauthorized();

        return Results.Ok(new
        {
            userId = dbUser.Id,
            userName = dbUser.UserName,
            role = dbUser.Role.ToString(),
            avatarUrl = dbUser.AvatarUrl
        });
    }

    private static async Task<IResult> UpdateProfile(
        UpdateProfileRequest request,
        ClaimsPrincipal user,
        UpdateProfileHandler handler,
        IOptions<JwtOptions> jwtOptions,
        HttpContext context,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        var (updated, token) = await handler.HandleAsync(
            userId,
            new UpdateProfileCommand(request.UserName, request.AvatarUrl, request.ClearAvatar),
            ct);

        context.Response.Cookies.Append(AuthCookieName, token, BuildAuthCookieOptions(jwtOptions.Value));

        return Results.Ok(new
        {
            userId = updated.Id,
            userName = updated.UserName,
            role = updated.Role.ToString(),
            avatarUrl = updated.AvatarUrl
        });
    }

    private static async Task<IResult> GetUsers(
        ClaimsPrincipal user,
        GetAllUsersHandler handler,
        CancellationToken ct)
    {
        var currentUserId = user.GetUserId();
        var users = await handler.HandleAsync(ct);
        var response = users
            .Where(u => u.Id != currentUserId)
            .Select(u => new UserResponse(u.Id, u.UserName));
        return Results.Ok(response);
    }
}
