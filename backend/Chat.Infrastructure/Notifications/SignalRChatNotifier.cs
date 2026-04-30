using Chat.Application.Interfaces;
using Chat.Domain.Models;
using Microsoft.AspNetCore.SignalR;

namespace Chat.Infrastructure.Notifications;

public class SignalRChatNotifier<THub>(IHubContext<THub, IChatClient> hubContext) : IChatNotifier
    where THub : Hub<IChatClient>
{
    private const string SystemSenderName = "System";
    private const string UserJoinedMessage = "{0} присоединился к чату";
    private const string UserLeftMessage = "{0} покинул чат";
    private const string UserGroupPrefix = "user-";

    public Task NotifyMessageAsync(Guid chatId, Guid messageId, string senderName, string? senderAvatarUrl, DateTime sentAt, MessagePayload payload, CancellationToken ct = default) =>
        ChatGroup(chatId).ReceiveMessage(chatId, messageId, senderName, senderAvatarUrl, sentAt, MessagePayloadDto.From(payload));

    public Task NotifyUnreadIncrementAsync(Guid chatId, IEnumerable<Guid> memberIds, Guid messageId, string senderName, string? senderAvatarUrl, DateTime sentAt, MessagePayload payload, CancellationToken ct = default) =>
        Task.WhenAll(memberIds.Select(id =>
            hubContext.Clients.Group($"{UserGroupPrefix}{id}").UnreadCountIncremented(chatId, messageId, senderName, senderAvatarUrl, sentAt, MessagePayloadDto.From(payload))));

    public Task NotifyMessageUpdatedAsync(Guid chatId, IEnumerable<Guid> memberIds, Message message, CancellationToken ct = default)
    {
        var dto = MessagePayloadDto.From(message.Payload);
        var editedAt = message.EditedAt ?? DateTime.UtcNow;
        return Task.WhenAll(memberIds.Select(id =>
            hubContext.Clients.Group($"{UserGroupPrefix}{id}").MessageUpdated(chatId, message.Id, dto, editedAt)));
    }

    public Task NotifyMessageDeletedAsync(Guid chatId, IEnumerable<Guid> memberIds, Guid messageId, DateTime deletedAt, CancellationToken ct = default) =>
        Task.WhenAll(memberIds.Select(id =>
            hubContext.Clients.Group($"{UserGroupPrefix}{id}").MessageDeleted(chatId, messageId, deletedAt)));

    public Task NotifyMessageReadAsync(Guid chatId, IEnumerable<Guid> memberIds, Guid userId, DateTime lastReadAt, CancellationToken ct = default) =>
        Task.WhenAll(memberIds.Select(id =>
            hubContext.Clients.Group($"{UserGroupPrefix}{id}").MessageRead(chatId, userId, lastReadAt)));

    public Task NotifyUserJoinedAsync(Guid chatId, string userName, CancellationToken ct = default) =>
        SendSystemMessageAsync(chatId, string.Format(UserJoinedMessage, userName));

    public Task NotifyUserLeftAsync(Guid chatId, string userName, CancellationToken ct = default) =>
        SendSystemMessageAsync(chatId, string.Format(UserLeftMessage, userName));

    public Task NotifyChatDeletedAsync(Guid chatId, IEnumerable<Guid> memberIds, CancellationToken ct = default) =>
        Task.WhenAll(memberIds.Select(id =>
            hubContext.Clients.Group($"{UserGroupPrefix}{id}").ChatDeleted(chatId)));

    public Task NotifyNewPrivateChatAsync(Guid targetUserId, CancellationToken ct = default) =>
        hubContext.Clients.Group($"{UserGroupPrefix}{targetUserId}").NewChatCreated();

    public Task NotifyUserOnlineStatusChangedAsync(Guid userId, bool isOnline, Guid contactUserId, CancellationToken ct = default) =>
        hubContext.Clients.Group($"{UserGroupPrefix}{contactUserId}").UserOnlineStatusChanged(userId, isOnline);

    public Task NotifyGroupOnlineCountAsync(Guid chatId, int onlineCount, int memberCount, CancellationToken ct = default) =>
        ChatGroup(chatId).GroupOnlineCountChanged(chatId, onlineCount, memberCount);

    private Task SendSystemMessageAsync(Guid chatId, string text) =>
        ChatGroup(chatId).ReceiveMessage(chatId, Guid.NewGuid(), SystemSenderName, null, DateTime.UtcNow, new TextPayloadDto(text));

    private IChatClient ChatGroup(Guid chatId) =>
        hubContext.Clients.Group(chatId.ToString());
}
