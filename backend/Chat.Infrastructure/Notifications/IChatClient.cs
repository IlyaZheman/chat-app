namespace Chat.Infrastructure.Notifications;

public interface IChatClient
{
    Task ReceiveMessage(string userName, MessagePayloadDto payload);
    Task ChatDeleted(Guid chatId);
    Task NewChatCreated();
}