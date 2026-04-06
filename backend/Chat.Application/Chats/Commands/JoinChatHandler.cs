using Chat.Application.Interfaces;
using Chat.Domain.Interfaces;
using Chat.Domain.ValueObjects;

namespace Chat.Application.Chats.Commands;

public class JoinChatHandler(
    IChatsRepository chatsRepository,
    IConnectionStorage connectionStorage,
    IChatNotifier notifier)
{
    public async Task HandleAsync(
        string connectionId,
        Guid userId,
        string userName,
        Guid chatId,
        CancellationToken ct = default)
    {
        var chat = await chatsRepository.GetByIdAsync(chatId, ct)
            ?? throw new InvalidOperationException("Chat not found.");

        if (chat.Members.All(m => m.UserId != userId))
            throw new InvalidOperationException("User is not a member of this chat.");

        var connection = new UserConnection(userId, userName, chatId);
        await connectionStorage.SaveAsync(connectionId, connection, ct);

        await notifier.NotifyUserJoinedAsync(chatId, userName, ct);
    }
}