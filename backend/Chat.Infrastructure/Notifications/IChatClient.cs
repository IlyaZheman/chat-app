namespace Chat.Infrastructure.Notifications;

// Интерфейс живёт в Infrastructure — SignalRChatNotifier знает только про него,
// а не про ChatHub из Chat.API
public interface IChatClient
{
    Task ReceiveMessage(string userName, string message);
}