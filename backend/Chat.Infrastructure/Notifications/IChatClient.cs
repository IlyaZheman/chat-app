namespace Chat.Infrastructure.Notifications;

public interface IChatClient
{
    Task ReceiveMessage(string userName, string message);
    Task ChatDeleted(Guid chatId);
}
