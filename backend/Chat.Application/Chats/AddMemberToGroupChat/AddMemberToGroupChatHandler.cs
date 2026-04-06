using Chat.Application.Interfaces;
using Chat.Domain.Enums;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats.AddMemberToGroupChat;

public class AddMemberToGroupChatHandler(
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

        if (chat.Type != ChatType.Group)
            throw new ForbiddenException("Cannot add members to a private chat.");

        if (!await chatsRepository.IsMemberAsync(chatId, requesterId, ct))
            throw new ForbiddenException("User is not a member of this chat.");

        if (await chatsRepository.IsMemberAsync(chatId, targetUserId, ct))
            throw new ConflictException("User is already a member of this chat.");

        var targetUser = await usersRepository.GetByIdAsync(targetUserId, ct)
            ?? throw new NotFoundException($"User '{targetUserId}' not found.");

        await chatsRepository.AddMemberAsync(chatId, targetUserId, ct);
        await chatsRepository.SaveChangesAsync(ct);

        await notifier.NotifyUserJoinedAsync(chatId, targetUser.UserName, ct);
    }
}
