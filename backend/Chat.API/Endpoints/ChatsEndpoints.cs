using System.Security.Claims;
using Chat.API.Contracts.Chats;
using Chat.Application.Chats.Commands;
using Chat.Application.Chats.Queries;

namespace Chat.API.Endpoints;

public static class ChatsEndpoints
{
    public static IEndpointRouteBuilder MapChatsEndpoints(this IEndpointRouteBuilder builder)
    {
        var chats = builder.MapGroup("chats").RequireAuthorization();

        chats.MapGet(string.Empty, GetUserChats);
        chats.MapPost("group", CreateGroupChat);
        chats.MapPost("private", GetOrCreatePrivateChat);
        chats.MapGet("{chatId:guid}/messages", GetMessages);

        return builder;
    }

    private static async Task<IResult> GetUserChats(
        ClaimsPrincipal user,
        GetUserChatsHandler handler,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var chats = await handler.HandleAsync(userId, ct);

        var response = chats.Select(c => new ChatResponse(
            c.Id,
            c.Type.ToString(),
            c.Name,
            c.CreatedAt));

        return Results.Ok(response);
    }

    private static async Task<IResult> CreateGroupChat(
        CreateGroupChatRequest request,
        ClaimsPrincipal user,
        CreateGroupChatHandler handler,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var chatId = await handler.HandleAsync(request.Name, userId, ct);
        return Results.Ok(new { chatId });
    }

    private static async Task<IResult> GetOrCreatePrivateChat(
        GetOrCreatePrivateChatRequest request,
        ClaimsPrincipal user,
        GetOrCreatePrivateChatHandler handler,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var chatId = await handler.HandleAsync(userId, request.TargetUserId, ct);
        return Results.Ok(new { chatId });
    }

    private static async Task<IResult> GetMessages(
        Guid chatId,
        ClaimsPrincipal user,
        GetChatMessagesHandler handler,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var messages = await handler.HandleAsync(chatId, userId, ct: ct);

        var response = messages.Select(m => new MessageResponse(
            m.Id,
            m.SenderId,
            m.Text,
            m.SentAt));

        return Results.Ok(response);
    }

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue("userId")
            ?? throw new UnauthorizedAccessException());
}
