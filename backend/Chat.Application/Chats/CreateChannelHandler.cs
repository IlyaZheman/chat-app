using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class CreateChannelHandler(IChatsRepository chatsRepository)
{
    public async Task<Guid> HandleAsync(string name, Guid creatorId, CancellationToken ct = default)
    {
        var chat = Domain.Models.Chat.CreateChannel(name, creatorId);
        await chatsRepository.AddAsync(chat, ct);
        await chatsRepository.SaveChangesAsync(ct);
        return chat.Id;
    }
}
