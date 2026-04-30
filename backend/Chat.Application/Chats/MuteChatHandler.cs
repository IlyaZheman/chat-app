using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class MuteChatHandler(IChatsRepository chatsRepository)
{
    public async Task HandleAsync(Guid chatId, Guid userId, DateTime? mutedUntil, CancellationToken ct = default)
    {
        if (!await chatsRepository.IsMemberAsync(chatId, userId, ct))
            throw new ForbiddenException("Not a member of this chat.");

        await chatsRepository.MuteChatAsync(chatId, userId, mutedUntil, ct);
    }
}
