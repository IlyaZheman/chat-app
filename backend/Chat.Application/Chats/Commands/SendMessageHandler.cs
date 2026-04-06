using Chat.Application.Interfaces;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats.Commands;

public class SendMessageHandler(
    IChatsRepository chatsRepository,
    IConnectionStorage connectionStorage,
    IChatNotifier notifier,
    IUsersRepository usersRepository)
{
    public async Task HandleAsync(string connectionId, string text, CancellationToken ct = default)
    {
        var connection = await connectionStorage.GetAsync(connectionId, ct)
            ?? throw new InvalidOperationException("Connection not found.");

        var chat = await chatsRepository.GetByIdAsync(connection.ChatId, ct)
            ?? throw new InvalidOperationException("Chat not found.");

        var message = chat.AddMessage(connection.UserId, text);

        await chatsRepository.AddMessageAsync(message, ct);
        await chatsRepository.SaveChangesAsync(ct);

        await notifier.NotifyMessageAsync(connection.ChatId, connection.UserName, text, ct);
    }
}