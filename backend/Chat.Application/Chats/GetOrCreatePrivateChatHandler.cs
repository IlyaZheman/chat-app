using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class GetOrCreatePrivateChatHandler(IChatsRepository chatsRepository)
{
    public async Task<Guid> HandleAsync(Guid currentUserId, Guid targetUserId, CancellationToken ct = default)
    {
        var existing = await chatsRepository.GetPrivateChatAsync(currentUserId, targetUserId, ct);
        if (existing is not null)
            return existing.Id;

        var chat = Domain.Models.Chat.CreatePrivate(currentUserId, targetUserId);

        await chatsRepository.AddAsync(chat, ct);
        await chatsRepository.SaveChangesAsync(ct);

        return chat.Id;
    }
}