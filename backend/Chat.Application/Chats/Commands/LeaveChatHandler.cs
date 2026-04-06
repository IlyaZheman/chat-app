using Chat.Application.Interfaces;

namespace Chat.Application.Chats.Commands;

public class LeaveChatHandler(
    IConnectionStorage connectionStorage,
    IChatNotifier notifier)
{
    public async Task HandleAsync(string connectionId, CancellationToken ct = default)
    {
        var connection = await connectionStorage.GetAsync(connectionId, ct);
        if (connection is null) return;

        await connectionStorage.RemoveAsync(connectionId, ct);
        await notifier.NotifyUserLeftAsync(connection.ChatId, connection.UserName, ct);
    }
}