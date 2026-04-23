using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Chats;

public class SendMessageHandler(
    IChatsRepository chatsRepository,
    IConnectionStorage connectionStorage,
    IChatNotifier notifier)
{
    public async Task HandleAsync(string connectionId, string text, CancellationToken ct = default)
    {
        var connection = await connectionStorage.GetAsync(connectionId, ct)
            ?? throw new ForbiddenException("Connection not found. Join a chat first.");

        if (!await chatsRepository.IsMemberAsync(connection.ChatId, connection.UserId, ct))
            throw new ForbiddenException("User is not a member of this chat.");

        var message = Message.Create(connection.ChatId, connection.UserId, connection.UserName, text);

        await chatsRepository.AddMessageAsync(message, ct);
        await chatsRepository.SaveChangesAsync(ct);

        await notifier.NotifyMessageAsync(connection.ChatId, connection.UserName, text, ct);
    }
}
