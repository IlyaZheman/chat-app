using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Chats.GetChatMessages;

public class GetChatMessagesHandler(IChatsRepository chatsRepository)
{
    public async Task<IReadOnlyList<Message>> HandleAsync(
        Guid chatId,
        Guid requestingUserId,
        int count = 50,
        CancellationToken ct = default)
    {
        if (!await chatsRepository.ExistsAsync(chatId, ct))
            throw new NotFoundException($"Chat '{chatId}' not found.");

        if (!await chatsRepository.IsMemberAsync(chatId, requestingUserId, ct))
            throw new ForbiddenException("Access denied.");

        return await chatsRepository.GetLastMessagesAsync(chatId, count, ct);
    }
}
