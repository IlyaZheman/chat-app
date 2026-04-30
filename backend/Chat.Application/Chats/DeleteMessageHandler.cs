using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Chats;

public class DeleteMessageHandler(IChatsRepository chatsRepository, IChatNotifier notifier)
{
    public async Task<Message> HandleAsync(
        Guid chatId,
        Guid messageId,
        Guid requesterUserId,
        CancellationToken ct = default)
    {
        var message = await chatsRepository.GetMessageAsync(messageId, ct)
            ?? throw new NotFoundException($"Message '{messageId}' not found.");

        if (message.ChatId != chatId)
            throw new NotFoundException($"Message '{messageId}' not found in chat '{chatId}'.");

        var isAuthor = message.SenderId == requesterUserId;
        if (!isAuthor)
        {
            var role = await chatsRepository.GetMemberRoleAsync(chatId, requesterUserId, ct);
            if (role is null || !role.Permissions.CanDeleteMessages)
                throw new ForbiddenException("Only the author or a moderator can delete this message.");
        }

        if (message.IsDeleted)
            return message;

        message.MarkDeleted();
        await chatsRepository.UpdateMessageAsync(message, ct);

        var chat = await chatsRepository.GetByIdAsync(chatId, ct);
        var memberIds = chat?.Members.Select(m => m.UserId).ToList() ?? [];

        await notifier.NotifyMessageDeletedAsync(chatId, memberIds, messageId, message.DeletedAt!.Value, ct);

        return message;
    }
}
