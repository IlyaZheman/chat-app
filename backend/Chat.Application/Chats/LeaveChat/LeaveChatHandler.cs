using Chat.Application.Interfaces;

namespace Chat.Application.Chats.LeaveChat;

public class LeaveChatHandler(IConnectionStorage connectionStorage)
{
    public async Task HandleAsync(string connectionId, CancellationToken ct = default)
    {
        var connection = await connectionStorage.GetAsync(connectionId, ct);
        if (connection is null) return;

        await connectionStorage.RemoveAsync(connectionId, ct);
    }
}