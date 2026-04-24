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

        chat.DeleteGroupChat(requesterId);

        await notifier.NotifyChatDeletedAsync(chatId, ct);
        await chatsRepository.DeleteAsync(chatId, ct);
    }
}