using Chat.Domain.Models;

namespace Chat.Application.Interfaces;

public interface IChatNotifier
{
    Task NotifyMessageAsync(Guid chatId, string senderName, MessagePayload payload, CancellationToken ct = default);
    Task NotifyUserJoinedAsync(Guid chatId, string userName, CancellationToken ct = default);
    Task NotifyUserLeftAsync(Guid chatId, string userName, CancellationToken ct = default);
    Task NotifyChatDeletedAsync(Guid chatId, CancellationToken ct = default);
    Task NotifyNewPrivateChatAsync(Guid targetUserId, CancellationToken ct = default);
    Task NotifyUserOnlineStatusChangedAsync(Guid userId, bool isOnline, Guid contactUserId, CancellationToken ct = default);
    Task NotifyGroupOnlineCountAsync(Guid chatId, int onlineCount, int memberCount, CancellationToken ct = default);
}