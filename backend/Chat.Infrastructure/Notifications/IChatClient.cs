namespace Chat.Infrastructure.Notifications;

public interface IChatClient
{
    Task ReceiveMessage(Guid chatId, string userName, MessagePayloadDto payload);
    Task ChatDeleted(Guid chatId);
    Task NewChatCreated();
    Task UserOnlineStatusChanged(Guid userId, bool isOnline);
    Task GroupOnlineCountChanged(Guid chatId, int onlineCount, int memberCount);
    Task UserTyping(Guid chatId, string userName, bool isTyping);
}