using System.Security.Claims;
using Chat.API.Contracts.Chats;
using Chat.API.Extensions;
using Chat.Application.Chats;
using Chat.Application.Interfaces;
using Chat.Domain.Enums;
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
        IOnlineStatusStorage onlineStorage,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        var chats = await handler.HandleAsync(userId, ct);

        var onlineChecks = chats.Select(c =>
        {
            if (c.Type == ChatType.Private)
            {
                var otherId = c.Members.FirstOrDefault(m => m.UserId != userId)?.UserId;
                return otherId.HasValue
                    ? onlineStorage.IsOnlineAsync(otherId.Value, ct).ContinueWith(t => (object)t.Result, ct)
                    : Task.FromResult<object>(false);
            }

            var memberIds = c.Members.Select(m => m.UserId);
            return onlineStorage.GetOnlineCountAsync(memberIds, ct).ContinueWith(t => (object)t.Result, ct);
        }).ToArray();

        var presenceResults = await Task.WhenAll(onlineChecks);

        var response = chats.Select((c, i) =>
        {
            var member = c.Members.FirstOrDefault(m => m.UserId == userId);
            var myRole = member?.Role.ToString() ?? "Member";
            Guid? otherUserId = null;
            string? otherUserName = null;
            var isOnline = false;
            var onlineCount = 0;

            if (c.Type == ChatType.Private)
            {
                var other = c.Members.FirstOrDefault(m => m.UserId != userId);
                otherUserId = other?.UserId;
                otherUserName = other?.UserName;
                isOnline = presenceResults[i] is bool b && b;
            }
            else
            {
                onlineCount = presenceResults[i] is int n ? n : 0;
            }

            return new ChatResponse(
                c.Id, c.Type.ToString(), c.Name, c.CreatedAt, myRole,
                otherUserName, otherUserId, c.Members.Count, isOnline, onlineCount);
        });

        return Results.Ok(response);
    }

    private static async Task<IResult> CreateGroupChat(
        CreateGroupChatRequest request,
        ClaimsPrincipal user,
        CreateGroupChatHandler handler,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        var chatId = await handler.HandleAsync(request.Name, userId, ct);
        return Results.Ok(new { chatId });
    }

    private static async Task<IResult> GetOrCreatePrivateChat(
        GetOrCreatePrivateChatRequest request,
        ClaimsPrincipal user,
        GetOrCreatePrivateChatHandler handler,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        var chatId = await handler.HandleAsync(userId, request.TargetUserId, ct);
        return Results.Ok(new { chatId });
    }

    private static async Task<IResult> GetMessages(
        Guid chatId,
        ClaimsPrincipal user,
        GetChatMessagesHandler handler,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        var messages = await handler.HandleAsync(chatId, userId, ct: ct);

        var response = messages.Select(m =>
            new MessageResponse(m.Id, m.SenderName, m.SentAt, MessagePayloadDto.From(m.Payload))
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
        var requesterId = user.GetUserId();
        await handler.HandleAsync(chatId, requesterId, request.UserId, ct);
        return Results.Ok();
    }

    private static async Task<IResult> DeleteChat(
        Guid chatId,
        ClaimsPrincipal user,
        DeleteGroupChatHandler handler,
        CancellationToken ct)
    {
        var requesterId = user.GetUserId();
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
        var requesterId = user.GetUserId();
        await handler.HandleAsync(chatId, requesterId, userId, ct);
        return Results.Ok();
    }

    private static async Task<IResult> GetAllGroups(
        GetAllGroupsHandler handler,
        CancellationToken ct)
    {
        var groups = await handler.HandleAsync(ct);

        var response = groups.Select(c =>
            new ChatResponse(c.Id, c.Type.ToString(), c.Name, c.CreatedAt, null, null, null, c.Members.Count, false, 0));

        return Results.Ok(response);
    }

    private static async Task<IResult> JoinGroup(
        Guid chatId,
        ClaimsPrincipal user,
        JoinGroupChatHandler handler,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        await handler.HandleAsync(chatId, userId, ct);
        return Results.Ok();
    }
}