using Chat.Application.Interfaces;
using Chat.Domain.Enums;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

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

        var requesterRole = await chatsRepository.GetMemberRoleAsync(chatId, requesterId, ct);
        if (requesterRole == null)
            throw new ForbiddenException("User is not a member of this chat.");
        if (requesterRole != ChatMemberRole.Owner)
            throw new ForbiddenException("Only the owner can add members to this chat.");

        if (await chatsRepository.IsMemberAsync(chatId, targetUserId, ct))
            throw new ConflictException("User is already a member of this chat.");

        var targetUser = await usersRepository.GetByIdAsync(targetUserId, ct)
            ?? throw new NotFoundException($"User '{targetUserId}' not found.");

        await chatsRepository.AddMemberAsync(chatId, targetUserId, ct);
        await chatsRepository.SaveChangesAsync(ct);

        await notifier.NotifyUserJoinedAsync(chatId, targetUser.UserName, ct);
    }
}