using Chat.Domain.Models;

namespace Chat.Domain.Interfaces;

public interface IChatsRepository
{
    Task AddAsync(Models.Chat chat, CancellationToken ct = default);
    Task<Models.Chat?> GetByIdAsync(Guid chatId, CancellationToken ct = default);
    Task<Models.Chat?> GetPrivateChatAsync(Guid firstUserId, Guid secondUserId, CancellationToken ct = default);
    Task<IReadOnlyList<Models.Chat>> GetUserChatsAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<Models.Chat>> GetDiscoverableChatsAsync(CancellationToken ct = default);

    Task<bool> ExistsAsync(Guid chatId, CancellationToken ct = default);
    Task<bool> IsMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default);
    Task<Role?> GetMemberRoleAsync(Guid chatId, Guid userId, CancellationToken ct = default);

    Task AddMemberAsync(Guid chatId, Guid userId, Guid? roleId, CancellationToken ct = default);
    Task RemoveMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default);
    Task DeleteAsync(Guid chatId, CancellationToken ct = default);

    Task AddMessageAsync(Message message, CancellationToken ct = default);
    Task<Message?> GetMessageAsync(Guid messageId, CancellationToken ct = default);
    Task UpdateMessageAsync(Message message, CancellationToken ct = default);
    Task<IReadOnlyList<Message>> GetLastMessagesAsync(Guid chatId, int count, CancellationToken ct = default);
    Task<(IReadOnlyList<Message> Messages, bool HasMore)> GetMessagesPageAsync(
        Guid chatId, int count, Guid? beforeMessageId, CancellationToken ct = default);
    Task<(IReadOnlyList<Message> Messages, bool HasMore)> GetMessagesAroundAsync(
        Guid chatId, Guid aroundMessageId, int count, CancellationToken ct = default);
    Task<Guid?> GetFirstUnreadMessageIdAsync(
        Guid chatId, Guid userId, DateTime? lastReadAt, CancellationToken ct = default);
    Task<IReadOnlyDictionary<Guid, Message?>> GetLastMessagePerChatAsync(
        IEnumerable<Guid> chatIds, CancellationToken ct = default);
    Task<IReadOnlyDictionary<Guid, int>> GetUnreadCountsAsync(
        Guid userId, IEnumerable<Guid> chatIds, CancellationToken ct = default);
    Task MarkChatReadAsync(Guid chatId, Guid userId, CancellationToken ct = default);
    Task<DateTime?> GetLastReadAtAsync(Guid chatId, Guid userId, CancellationToken ct = default);
    Task MuteChatAsync(Guid chatId, Guid userId, DateTime? mutedUntil, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
