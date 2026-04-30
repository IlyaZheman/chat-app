using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Chats;

public class EditMessageHandler(IChatsRepository chatsRepository, IChatNotifier notifier)
{
    public async Task<Message> HandleAsync(
        Guid chatId,
        Guid messageId,
        Guid editorUserId,
        string newText,
        CancellationToken ct = default)
    {
        var message = await chatsRepository.GetMessageAsync(messageId, ct)
            ?? throw new NotFoundException($"Message '{messageId}' not found.");

        if (message.ChatId != chatId)
            throw new NotFoundException($"Message '{messageId}' not found in chat '{chatId}'.");

        if (!await chatsRepository.IsMemberAsync(chatId, editorUserId, ct))
            throw new ForbiddenException("Access denied.");

        message.EditText(editorUserId, newText);

        await chatsRepository.UpdateMessageAsync(message, ct);

        var chat = await chatsRepository.GetByIdAsync(chatId, ct);
        var memberIds = chat?.Members.Select(m => m.UserId).ToList() ?? [];

        await notifier.NotifyMessageUpdatedAsync(chatId, memberIds, message, ct);

        return message;
    }
}
