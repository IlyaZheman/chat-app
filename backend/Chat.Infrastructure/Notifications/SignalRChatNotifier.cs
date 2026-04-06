using Chat.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Chat.Infrastructure.Notifications;

// Принимает IHubContext через интерфейс — конкретный тип Hub подставляется снаружи при регистрации
public class SignalRChatNotifier<THub>(IHubContext<THub, IChatClient> hubContext) : IChatNotifier
    where THub : Hub<IChatClient>
{
    public async Task NotifyMessageAsync(Guid chatId, string senderName, string text, CancellationToken ct = default)
    {
        await hubContext.Clients
            .Group(chatId.ToString())
            .ReceiveMessage(senderName, text);
    }

    public async Task NotifyUserJoinedAsync(Guid chatId, string userName, CancellationToken ct = default)
    {
        await hubContext.Clients
            .Group(chatId.ToString())
            .ReceiveMessage("System", $"{userName} присоединился к чату");
    }

    public async Task NotifyUserLeftAsync(Guid chatId, string userName, CancellationToken ct = default)
    {
        await hubContext.Clients
            .Group(chatId.ToString())
            .ReceiveMessage("System", $"{userName} покинул чат");
    }
}
