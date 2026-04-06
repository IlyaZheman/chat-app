using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Chats.Queries;

public class GetChatMessagesHandler(IChatsRepository chatsRepository)
{
    public async Task<IReadOnlyList<Message>> HandleAsync(
        Guid chatId,
        Guid requestingUserId,
        int count = 50,
        CancellationToken ct = default)
    {
        var chat = await chatsRepository.GetByIdAsync(chatId, ct)
            ?? throw new InvalidOperationException("Chat not found.");

        if (chat.Members.All(m => m.UserId != requestingUserId))
            throw new InvalidOperationException("Access denied.");

        return await chatsRepository.GetLastMessagesAsync(chatId, count, ct);
    }
}