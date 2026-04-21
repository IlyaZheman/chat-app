using Chat.Application.Interfaces;
using Chat.Domain.Enums;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats.LeaveGroupChat;

public class LeaveGroupChatHandler(
    IChatsRepository chatsRepository,
    IConnectionStorage connectionStorage,
    IChatNotifier notifier)
{
    public async Task<Guid> HandleAsync(
        string connectionId,
        Guid userId,
        string userName,
        CancellationToken ct = default)
    {
        var connection = await connectionStorage.GetAsync(connectionId, ct)
            ?? throw new ForbiddenException("No active chat session found.");

        var chat = await chatsRepository.GetByIdAsync(connection.ChatId, ct)
            ?? throw new NotFoundException($"Chat '{connection.ChatId}' not found.");

        if (chat.Type != ChatType.Group)
            throw new ForbiddenException("Cannot leave a private chat.");

        if (!await chatsRepository.IsMemberAsync(connection.ChatId, userId, ct))
            throw new ForbiddenException("User is not a member of this chat.");

        await chatsRepository.RemoveMemberAsync(connection.ChatId, userId, ct);
        await chatsRepository.SaveChangesAsync(ct);

        await connectionStorage.RemoveAsync(connectionId, ct);

        await notifier.NotifyUserLeftAsync(connection.ChatId, userName, ct);

        return connection.ChatId;
    }
}
