using Chat.Application.Interfaces;
using Chat.Application.Models;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class JoinChatHandler(
    IChatsRepository chatsRepository,
    IConnectionStorage connectionStorage,
    IUsersRepository usersRepository)
{
    public async Task<Guid?> HandleAsync(
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

        var user = await usersRepository.GetByIdAsync(userId, ct);
        var previous = await connectionStorage.GetAsync(connectionId, ct);
        var connection = new UserConnection(userId, userName, chatId, user?.AvatarUrl);
        await connectionStorage.SaveAsync(connectionId, connection, ct);
        return previous?.ChatId;
    }
}