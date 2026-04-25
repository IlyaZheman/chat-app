using System.Security.Claims;
using Chat.API.Contracts.Chats;
using Chat.Application.Chats;
using Chat.Domain.Enums;
using Chat.Domain.Models;
using Chat.Infrastructure.Notifications;

namespace Chat.API.Endpoints;

public static class ChatsEndpoints
{
    public static IEndpointRouteBuilder MapChatsEndpoints(this IEndpointRouteBuilder builder)
    {
        var chats = builder.MapGroup("chats").RequireAuthorization();

        chats.MapGet(string.Empty, GetUserChats);
        chats.MapGet("groups", GetAllGroups);
        chats.MapPost("group", CreateGroupChat);
        chats.MapPost("private", GetOrCreatePrivateChat);
        chats.MapPost("{chatId:guid}/join", JoinGroup);
        chats.MapGet("{chatId:guid}/messages", GetMessages);
        chats.MapPost("{chatId:guid}/members", AddMember);
        chats.MapDelete("{chatId:guid}", DeleteChat);
        chats.MapDelete("{chatId:guid}/members/{userId:guid}", RemoveMember);

        return builder;
    }

    private static async Task<IResult> GetUserChats(
        ClaimsPrincipal user,
        GetUserChatsHandler handler,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var chats = await handler.HandleAsync(userId, ct);

        var response = chats.Select(c =>
        {
            var member = c.Members.FirstOrDefault(m => m.UserId == userId);
            var myRole = member?.Role.ToString() ?? "Member";
            var otherUserName = c.Type == ChatType.Private
                ? c.Members.FirstOrDefault(m => m.UserId != userId)?.UserName
                : null;
            return new ChatResponse(c.Id, c.Type.ToString(), c.Name, c.CreatedAt, myRole, otherUserName);
        });

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

        var response = messages.Select(m =>
            new MessageResponse(m.Id, m.SenderName, m.SentAt, ToPayloadDto(m.Payload))
        );

        return Results.Ok(response);
    }

    private static async Task<IResult> AddMember(
        Guid chatId,
        AddMemberRequest request,
        ClaimsPrincipal user,
        AddMemberToGroupChatHandler handler,
        CancellationToken ct)
    {
        var requesterId = GetUserId(user);
        await handler.HandleAsync(chatId, requesterId, request.UserId, ct);
        return Results.Ok();
    }

    private static async Task<IResult> DeleteChat(
        Guid chatId,
        ClaimsPrincipal user,
        DeleteGroupChatHandler handler,
        CancellationToken ct)
    {
        var requesterId = GetUserId(user);
        await handler.HandleAsync(chatId, requesterId, ct);
        return Results.NoContent();
    }

    private static async Task<IResult> RemoveMember(
        Guid chatId,
        Guid userId,
        ClaimsPrincipal user,
        RemoveMemberFromGroupChatHandler handler,
        CancellationToken ct)
    {
        var requesterId = GetUserId(user);
        await handler.HandleAsync(chatId, requesterId, userId, ct);
        return Results.Ok();
    }

    private static async Task<IResult> GetAllGroups(
        GetAllGroupsHandler handler,
        CancellationToken ct)
    {
        var groups = await handler.HandleAsync(ct);

        var response = groups.Select(c =>
            new ChatResponse(c.Id, c.Type.ToString(), c.Name, c.CreatedAt, null, null));

        return Results.Ok(response);
    }

    private static async Task<IResult> JoinGroup(
        Guid chatId,
        ClaimsPrincipal user,
        JoinGroupChatHandler handler,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        await handler.HandleAsync(chatId, userId, ct);
        return Results.Ok();
    }

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue("userId") ?? throw new UnauthorizedAccessException());

    private static MessagePayloadDto ToPayloadDto(MessagePayload payload) => payload switch
    {
        TextPayload t  => new TextPayloadDto(t.Text),
        ImagePayload i => new ImagePayloadDto(i.Url, i.FileName, i.Caption, i.CaptionPosition.ToString().ToLower()),
        FilePayload f  => new FilePayloadDto(f.Url, f.FileName, f.MediaType),
        _              => throw new NotSupportedException(payload.GetType().Name)
    };
}