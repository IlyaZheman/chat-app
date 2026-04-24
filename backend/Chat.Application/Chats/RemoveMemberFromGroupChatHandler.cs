using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class RemoveMemberFromGroupChatHandler(
    IChatsRepository chatsRepository,
    IUsersRepository usersRepository,
    IChatNotifier notifier)
{
    public async Task HandleAsync(
        Guid chatId,
        Guid requesterId,
        Guid targetUserId,
        CancellationToken ct = default)
    {
        var chat = await chatsRepository.GetByIdAsync(chatId, ct)
            ?? throw new NotFoundException($"Chat '{chatId}' not found.");

        chat.RemoveMemberByOwner(requesterId, targetUserId);

        await chatsRepository.RemoveMemberAsync(chatId, targetUserId, ct);
        await chatsRepository.SaveChangesAsync(ct);

        var target = await usersRepository.GetByIdAsync(targetUserId, ct);
        if (target is not null)
            await notifier.NotifyUserLeftAsync(chatId, target.UserName, ct);
    }
}