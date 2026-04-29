using System.Security.Claims;

namespace Chat.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue("userId") ?? throw new UnauthorizedAccessException());

    public static string GetUserName(this ClaimsPrincipal user) =>
        user.FindFirstValue("userName") ?? throw new UnauthorizedAccessException();
}
