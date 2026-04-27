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

    public Task NotifyMessageAsync(Guid chatId, string senderName, MessagePayload payload, CancellationToken ct = default) =>
        ChatGroup(chatId).ReceiveMessage(senderName, MessagePayloadDto.From(payload));

    public Task NotifyUserJoinedAsync(Guid chatId, string userName, CancellationToken ct = default) =>
        SendSystemMessageAsync(chatId, string.Format(UserJoinedMessage, userName));

    public Task NotifyUserLeftAsync(Guid chatId, string userName, CancellationToken ct = default) =>
        SendSystemMessageAsync(chatId, string.Format(UserLeftMessage, userName));

    public Task NotifyChatDeletedAsync(Guid chatId, CancellationToken ct = default) =>
        ChatGroup(chatId).ChatDeleted(chatId);

    public Task NotifyNewPrivateChatAsync(Guid targetUserId, CancellationToken ct = default) =>
        hubContext.Clients.Group($"{UserGroupPrefix}{targetUserId}").NewChatCreated();

    private Task SendSystemMessageAsync(Guid chatId, string text) =>
        ChatGroup(chatId).ReceiveMessage(SystemSenderName, new TextPayloadDto(text));

    private IChatClient ChatGroup(Guid chatId) =>
        hubContext.Clients.Group(chatId.ToString());
}
