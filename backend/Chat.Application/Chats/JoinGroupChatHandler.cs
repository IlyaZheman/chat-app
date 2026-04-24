using Chat.Domain.Enums;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class JoinGroupChatHandler(IChatsRepository chatsRepository)
{
    public async Task HandleAsync(Guid chatId, Guid userId, CancellationToken ct = default)
    {
        var chat = await chatsRepository.GetByIdAsync(chatId, ct)
            ?? throw new NotFoundException($"Chat '{chatId}' not found.");

        if (chat.Type != ChatType.Group)
            throw new ForbiddenException("Cannot join a private chat.");

        if (await chatsRepository.IsMemberAsync(chatId, userId, ct))
            throw new ConflictException("Already a member of this chat.");

        await chatsRepository.AddMemberAsync(chatId, userId, ct);
        await chatsRepository.SaveChangesAsync(ct);
    }
}