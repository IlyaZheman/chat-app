using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class DeleteGroupChatHandler(
    IChatsRepository chatsRepository,
    IChatNotifier notifier)
{
    public async Task HandleAsync(Guid chatId, Guid requesterId, CancellationToken ct = default)
    {
        var chat = await chatsRepository.GetByIdAsync(chatId, ct)
            ?? throw new NotFoundException($"Chat '{chatId}' not found.");

        chat.DeleteChat(requesterId);

        var memberIds = chat.Members.Select(m => m.UserId).ToList();
        await notifier.NotifyChatDeletedAsync(chatId, memberIds, ct);
        await chatsRepository.DeleteAsync(chatId, ct);
    }
}
