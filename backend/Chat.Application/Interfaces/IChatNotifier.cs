namespace Chat.Application.Interfaces;

// Абстракция над SignalR — Application ничего не знает про Hub
public interface IChatNotifier
{
    Task NotifyMessageAsync(Guid chatId, string senderName, string text, CancellationToken ct = default);
    Task NotifyUserJoinedAsync(Guid chatId, string userName, CancellationToken ct = default);
    Task NotifyUserLeftAsync(Guid chatId, string userName, CancellationToken ct = default);
}