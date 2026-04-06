using Chat.Domain.Interfaces;

namespace Chat.Application.Chats.Commands;

public class CreateGroupChatHandler(IChatsRepository chatsRepository)
{
    public async Task<Guid> HandleAsync(string name, Guid creatorId, CancellationToken ct = default)
    {
        var chat = Domain.Models.Chat.CreateGroup(name, creatorId);

        await chatsRepository.AddAsync(chat, ct);
        await chatsRepository.SaveChangesAsync(ct);

        return chat.Id;
    }
}