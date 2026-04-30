using System.Security.Claims;
using Chat.API.Contracts.Chats;
using Chat.API.Extensions;
using Chat.Application.Chats;
using Chat.Application.Interfaces;
using Chat.Domain.Enums;
using Chat.Domain.Interfaces;
using Chat.Infrastructure.Notifications;
using Microsoft.AspNetCore.Mvc;

namespace Chat.API.Endpoints;

public static class ChatsEndpoints
{
    public static IEndpointRouteBuilder MapChatsEndpoints(this IEndpointRouteBuilder builder)
    {
        var chats = builder.MapGroup("chats").RequireAuthorization();

        chats.MapGet(string.Empty, GetUserChats);
        chats.MapGet("groups", GetAllGroups);
        chats.MapPost("group", CreateGroupChat);
        chats.MapPost("channel", CreateChannel);
        chats.MapPost("private", GetOrCreatePrivateChat);
        chats.MapPost("{chatId:guid}/join", JoinGroup);
        chats.MapGet("{chatId:guid}/messages", GetMessages);
        chats.MapPatch("{chatId:guid}/messages/{messageId:guid}", EditMessage);
        chats.MapDelete("{chatId:guid}/messages/{messageId:guid}", DeleteMessage);
        chats.MapPost("{chatId:guid}/read", MarkRead);
        chats.MapPost("{chatId:guid}/members", AddMember);
        chats.MapPost("{chatId:guid}/mute", MuteChat);
        chats.MapDelete("{chatId:guid}", DeleteChat);
        chats.MapDelete("{chatId:guid}/members/{userId:guid}", RemoveMember);

        return builder;
    }

    private static async Task<IResult> GetUserChats(
        ClaimsPrincipal user,
        GetUserChatsHandler handler,
        IOnlineStatusStorage onlineStorage,
        IChatsRepository chatsRepository,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        var chats = await handler.HandleAsync(userId, ct);

        var chatIds = chats.Select(c => c.Id).ToList();

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

        var presenceTask = Task.WhenAll(onlineChecks);
        var lastMessages = await chatsRepository.GetLastMessagePerChatAsync(chatIds, ct);
        var unreadCounts = await chatsRepository.GetUnreadCountsAsync(userId, chatIds, ct);
        await presenceTask;

        var response = chats.Select((c, i) =>
        {
            var member = c.Members.FirstOrDefault(m => m.UserId == userId);
            var myRole = member?.RoleName ?? "Member";
            Guid? otherUserId = null;
            string? otherUserName = null;
            var isOnline = false;
            var onlineCount = 0;

            string? otherUserAvatarUrl = null;
            if (c.Type == ChatType.Private)
            {
                var other = c.Members.FirstOrDefault(m => m.UserId != userId);
                otherUserId = other?.UserId;
                otherUserName = other?.UserName;
                otherUserAvatarUrl = other?.AvatarUrl;
                isOnline = onlineChecks[i].Result is true;
            }
            else
            {
                onlineCount = onlineChecks[i].Result is int n ? n : 0;
            }

            var lastMsg = lastMessages.GetValueOrDefault(c.Id);
            MessageResponse? lastMsgResponse = lastMsg is not null
                ? new MessageResponse(lastMsg.Id, lastMsg.SenderName, lastMsg.SenderAvatarUrl, lastMsg.SentAt, MessagePayloadDto.From(lastMsg.Payload), lastMsg.EditedAt, lastMsg.DeletedAt)
                : null;

            var mutedUntil = member?.MutedUntil;

            if (c.Type == ChatType.Private)
                return (object)new PrivateChatResponse(
                    c.Id, "Private", c.CreatedAt,
                    otherUserName, otherUserId, otherUserAvatarUrl, isOnline,
                    lastMsgResponse, unreadCounts.GetValueOrDefault(c.Id, 0), mutedUntil);

            return new GroupChatResponse(
                c.Id, c.Type.ToString(), c.Name, c.CreatedAt, myRole,
                c.Members.Count, onlineCount,
                lastMsgResponse, unreadCounts.GetValueOrDefault(c.Id, 0), mutedUntil);
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

    private static async Task<IResult> CreateChannel(
        CreateChannelRequest request,
        ClaimsPrincipal user,
        CreateChannelHandler handler,
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
        CancellationToken ct,
        [FromQuery] Guid? before = null,
        [FromQuery] Guid? around = null,
        [FromQuery] int count = 50)
    {
        var userId = user.GetUserId();
        var (messages, hasMore, firstUnreadMessageId) =
            await handler.HandleAsync(chatId, userId, count, before, around, ct);

        var response = new MessagesPageResponse(
            messages.Select(m => new MessageResponse(m.Id, m.SenderName, m.SenderAvatarUrl, m.SentAt, MessagePayloadDto.From(m.Payload), m.EditedAt, m.DeletedAt)).ToList(),
            hasMore,
            firstUnreadMessageId);

        return Results.Ok(response);
    }

    private static async Task<IResult> EditMessage(
        Guid chatId,
        Guid messageId,
        EditMessageRequest request,
        ClaimsPrincipal user,
        EditMessageHandler handler,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        var message = await handler.HandleAsync(chatId, messageId, userId, request.Text, ct);
        return Results.Ok(new MessageResponse(
            message.Id, message.SenderName, message.SenderAvatarUrl, message.SentAt,
            MessagePayloadDto.From(message.Payload), message.EditedAt, message.DeletedAt));
    }

    private static async Task<IResult> DeleteMessage(
        Guid chatId,
        Guid messageId,
        ClaimsPrincipal user,
        DeleteMessageHandler handler,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        await handler.HandleAsync(chatId, messageId, userId, ct);
        return Results.NoContent();
    }

    private static async Task<IResult> MarkRead(
        Guid chatId,
        ClaimsPrincipal user,
        IChatsRepository chatsRepository,
        IChatNotifier notifier,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        await chatsRepository.MarkChatReadAsync(chatId, userId, ct);

        var lastReadAt = await chatsRepository.GetLastReadAtAsync(chatId, userId, ct) ?? DateTime.UtcNow;

        var chat = await chatsRepository.GetByIdAsync(chatId, ct);
        if (chat is not null)
        {
            var memberIds = chat.Members.Select(m => m.UserId).ToList();
            await notifier.NotifyMessageReadAsync(chatId, memberIds, userId, lastReadAt, ct);
        }

        return Results.NoContent();
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

    private static async Task<IResult> MuteChat(
        Guid chatId,
        MuteChatRequest request,
        ClaimsPrincipal user,
        MuteChatHandler handler,
        CancellationToken ct)
    {
        var userId = user.GetUserId();
        await handler.HandleAsync(chatId, userId, request.MutedUntil, ct);
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
            new GroupChatResponse(c.Id, c.Type.ToString(), c.Name, c.CreatedAt, null, c.Members.Count, 0, null, 0, null));

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
