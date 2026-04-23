using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.ValueObjects;

namespace Chat.Application.Chats;

public class JoinChatHandler(
    IChatsRepository chatsRepository,
    IConnectionStorage connectionStorage)
{
    public async Task HandleAsync(
        string connectionId,
        Guid userId,
        string userName,
        Guid chatId,
        CancellationToken ct = default)
    {
        if (!await chatsRepository.ExistsAsync(chatId, ct))
            throw new NotFoundException($"Chat '{chatId}' not found.");

        if (!await chatsRepository.IsMemberAsync(chatId, userId, ct))
            throw new ForbiddenException("User is not a member of this chat.");

        var connection = new UserConnection(userId, userName, chatId);
        await connectionStorage.SaveAsync(connectionId, connection, ct);
    }
}
