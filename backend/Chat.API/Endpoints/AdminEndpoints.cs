using Chat.API.Contracts.Admin;
using Chat.Application.Admin;
using Chat.Domain.Enums;

namespace Chat.API.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder builder)
    {
        var admin = builder.MapGroup("admin").RequireAuthorization("AdminPolicy");

        admin.MapGet("users", GetAllUsers);
        admin.MapPatch("users/{id:guid}/role", AssignRole);

        return builder;
    }

    private static async Task<IResult> GetAllUsers(
        GetAllUsersHandler handler,
        CancellationToken ct)
    {
        var users = await handler.HandleAsync(ct);
        var response = users.Select(u => new UserSummaryResponse(u.Id, u.UserName, u.Email, u.Role.ToString()));
        return Results.Ok(response);
    }

    private static async Task<IResult> AssignRole(
        Guid id,
        AssignRoleRequest request,
        AssignUserRoleHandler handler,
        CancellationToken ct)
    {
        if (!Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var role))
            return Results.BadRequest($"Invalid role '{request.Role}'. Valid values: User, Admin.");

        await handler.HandleAsync(new AssignUserRoleCommand(id, role), ct);
        return Results.Ok();
    }
}
