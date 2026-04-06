using Chat.Domain.Interfaces;

namespace Chat.Application.Chats.Queries;

public class GetUserChatsHandler(IChatsRepository chatsRepository)
{
    public async Task<IReadOnlyList<Domain.Models.Chat>> HandleAsync(Guid userId, CancellationToken ct = default)
    {
        return await chatsRepository.GetUserChatsAsync(userId, ct);
    }
}