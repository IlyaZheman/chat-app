using Chat.Domain.Enums;
using Chat.Domain.Models;

namespace Chat.Domain.Interfaces;

public interface IChatsRepository
{
    Task AddAsync(Models.Chat chat, CancellationToken ct = default);
    Task<Models.Chat?> GetByIdAsync(Guid chatId, CancellationToken ct = default);
    Task<Models.Chat?> GetPrivateChatAsync(Guid firstUserId, Guid secondUserId, CancellationToken ct = default);
    Task<IReadOnlyList<Models.Chat>> GetUserChatsAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<Models.Chat>> GetAllGroupChatsAsync(CancellationToken ct = default);

    Task<bool> ExistsAsync(Guid chatId, CancellationToken ct = default);
    Task<bool> IsMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default);
    Task<ChatMemberRole?> GetMemberRoleAsync(Guid chatId, Guid userId, CancellationToken ct = default);

    Task AddMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default);
    Task RemoveMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default);
    Task DeleteAsync(Guid chatId, CancellationToken ct = default);

    Task AddMessageAsync(Message message, CancellationToken ct = default);
    Task<IReadOnlyList<Message>> GetLastMessagesAsync(Guid chatId, int count, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}