using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class GetOrCreatePrivateChatHandler(IChatsRepository chatsRepository, IChatNotifier notifier)
{
    public async Task<Guid> HandleAsync(Guid currentUserId, Guid targetUserId, CancellationToken ct = default)
    {
        var existing = await chatsRepository.GetPrivateChatAsync(currentUserId, targetUserId, ct);
        if (existing is not null)
            return existing.Id;

        var chat = Domain.Models.Chat.CreatePrivate(currentUserId, targetUserId);

        try
        {
            await chatsRepository.AddAsync(chat, ct);
            await chatsRepository.SaveChangesAsync(ct);
        }
        catch (ConflictException)
        {
            var concurrentChat = await chatsRepository.GetPrivateChatAsync(currentUserId, targetUserId, ct);
            return concurrentChat!.Id;
        }

        await notifier.NotifyNewPrivateChatAsync(targetUserId, ct);

        return chat.Id;
    }
}