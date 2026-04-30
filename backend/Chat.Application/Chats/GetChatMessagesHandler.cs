using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Chats;

public class GetChatMessagesHandler(IChatsRepository chatsRepository)
{
    public async Task<(IReadOnlyList<Message> Messages, bool HasMore, Guid? FirstUnreadMessageId)> HandleAsync(
        Guid chatId,
        Guid requestingUserId,
        int count = 50,
        Guid? beforeMessageId = null,
        Guid? aroundMessageId = null,
        CancellationToken ct = default)
    {
        if (!await chatsRepository.ExistsAsync(chatId, ct))
            throw new NotFoundException($"Chat '{chatId}' not found.");

        if (!await chatsRepository.IsMemberAsync(chatId, requestingUserId, ct))
            throw new ForbiddenException("Access denied.");

        if (aroundMessageId.HasValue)
        {
            var (aroundMessages, aroundHasMore) =
                await chatsRepository.GetMessagesAroundAsync(chatId, aroundMessageId.Value, count, ct);
            return (aroundMessages, aroundHasMore, null);
        }

        var (messages, hasMore) = await chatsRepository.GetMessagesPageAsync(chatId, count, beforeMessageId, ct);

        Guid? firstUnreadMessageId = null;
        if (beforeMessageId is null)
        {
            var lastReadAt = await chatsRepository.GetLastReadAtAsync(chatId, requestingUserId, ct);
            firstUnreadMessageId = await chatsRepository.GetFirstUnreadMessageIdAsync(
                chatId, requestingUserId, lastReadAt, ct);
        }

        return (messages, hasMore, firstUnreadMessageId);
    }
}