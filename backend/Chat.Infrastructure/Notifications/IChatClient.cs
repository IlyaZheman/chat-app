namespace Chat.Infrastructure.Notifications;

public interface IChatClient
{
    Task ReceiveMessage(Guid chatId, Guid messageId, string userName, string? senderAvatarUrl, DateTime sentAt, MessagePayloadDto payload);
    Task UnreadCountIncremented(Guid chatId, Guid messageId, string senderName, string? senderAvatarUrl, DateTime sentAt, MessagePayloadDto payload);
    Task MessageUpdated(Guid chatId, Guid messageId, MessagePayloadDto payload, DateTime editedAt);
    Task MessageDeleted(Guid chatId, Guid messageId, DateTime deletedAt);
    Task MessageRead(Guid chatId, Guid userId, DateTime lastReadAt);
    Task ChatDeleted(Guid chatId);
    Task NewChatCreated();
    Task UserOnlineStatusChanged(Guid userId, bool isOnline);
    Task GroupOnlineCountChanged(Guid chatId, int onlineCount, int memberCount);
    Task UserTyping(Guid chatId, string userName, bool isTyping);
}
