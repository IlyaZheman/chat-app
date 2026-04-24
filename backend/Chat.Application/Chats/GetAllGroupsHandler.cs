using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class GetAllGroupsHandler(IChatsRepository chatsRepository)
{
    public Task<IReadOnlyList<Domain.Models.Chat>> HandleAsync(CancellationToken ct = default) =>
        chatsRepository.GetAllGroupChatsAsync(ct);
}