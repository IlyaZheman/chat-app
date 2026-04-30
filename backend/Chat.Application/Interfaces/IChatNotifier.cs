using Chat.Domain.Models;

namespace Chat.Application.Interfaces;

public interface IChatNotifier
{
    Task NotifyMessageAsync(Guid chatId, Guid messageId, string senderName, string? senderAvatarUrl, DateTime sentAt, MessagePayload payload, CancellationToken ct = default);
    Task NotifyUnreadIncrementAsync(Guid chatId, IEnumerable<Guid> memberIds, Guid messageId, string senderName, string? senderAvatarUrl, DateTime sentAt, MessagePayload payload, CancellationToken ct = default);
    Task NotifyMessageUpdatedAsync(Guid chatId, IEnumerable<Guid> memberIds, Message message, CancellationToken ct = default);
    Task NotifyMessageDeletedAsync(Guid chatId, IEnumerable<Guid> memberIds, Guid messageId, DateTime deletedAt, CancellationToken ct = default);
    Task NotifyMessageReadAsync(Guid chatId, IEnumerable<Guid> memberIds, Guid userId, DateTime lastReadAt, CancellationToken ct = default);
    Task NotifyUserJoinedAsync(Guid chatId, string userName, CancellationToken ct = default);
    Task NotifyUserLeftAsync(Guid chatId, string userName, CancellationToken ct = default);
    Task NotifyChatDeletedAsync(Guid chatId, IEnumerable<Guid> memberIds, CancellationToken ct = default);
    Task NotifyNewPrivateChatAsync(Guid targetUserId, CancellationToken ct = default);
    Task NotifyUserOnlineStatusChangedAsync(Guid userId, bool isOnline, Guid contactUserId, CancellationToken ct = default);
    Task NotifyGroupOnlineCountAsync(Guid chatId, int onlineCount, int memberCount, CancellationToken ct = default);
}
