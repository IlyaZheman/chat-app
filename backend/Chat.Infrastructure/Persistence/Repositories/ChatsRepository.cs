using System.Text.Json;
using Chat.Domain.Enums;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;
using Chat.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Chat.Infrastructure.Persistence.Repositories;

public class ChatsRepository(AppDbContext context, ILogger<ChatsRepository> logger) : IChatsRepository
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private static string SerializePayload(MessagePayload payload) =>
        JsonSerializer.Serialize(payload, JsonOpts);

    private static MessagePayload DeserializePayload(string json) =>
        JsonSerializer.Deserialize<MessagePayload>(json, JsonOpts)!;

    public async Task AddAsync(Domain.Models.Chat chat, CancellationToken ct = default)
    {
        var entity = MapToEntity(chat);
        await context.Chats.AddAsync(entity, ct);
    }

    public async Task<Domain.Models.Chat?> GetByIdAsync(Guid chatId, CancellationToken ct = default)
    {
        var entity = await context.Chats
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Members).ThenInclude(m => m.Role)
            .Include(c => c.Roles)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == chatId, ct);

        return entity is null ? null : MapToDomain(entity);
    }

    public async Task<Domain.Models.Chat?> GetPrivateChatAsync(
        Guid firstUserId,
        Guid secondUserId,
        CancellationToken ct = default)
    {
        var entity = await context.Chats
            .Include(c => c.Members)
            .AsNoTracking()
            .Where(c => c.Type == ChatType.Private
                && c.Members.Any(m => m.UserId == firstUserId)
                && c.Members.Any(m => m.UserId == secondUserId))
            .FirstOrDefaultAsync(ct);

        return entity is null ? null : MapToDomain(entity);
    }

    public async Task<IReadOnlyList<Domain.Models.Chat>> GetDiscoverableChatsAsync(CancellationToken ct = default)
    {
        var entities = await context.Chats
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Members).ThenInclude(m => m.Role)
            .Include(c => c.Roles)
            .AsNoTracking()
            .Where(c => c.Type == ChatType.Group || c.Type == ChatType.Channel)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

        return entities.Select(MapToDomain).ToList();
    }

    public async Task<IReadOnlyList<Domain.Models.Chat>> GetUserChatsAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var entities = await context.Chats
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Members).ThenInclude(m => m.Role)
            .Include(c => c.Roles)
            .AsNoTracking()
            .Where(c => c.Members.Any(m => m.UserId == userId))
            .OrderByDescending(c =>
                context.Messages.Where(m => m.ChatId == c.Id).Max(m => (DateTime?)m.SentAt) ?? c.CreatedAt)
            .ToListAsync(ct);

        return entities.Select(MapToDomain).ToList();
    }

    public Task<bool> ExistsAsync(Guid chatId, CancellationToken ct = default) =>
        context.Chats.AnyAsync(c => c.Id == chatId, ct);

    public Task<bool> IsMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default) =>
        context.ChatMembers.AnyAsync(m => m.ChatId == chatId && m.UserId == userId, ct);

    public async Task<Role?> GetMemberRoleAsync(Guid chatId, Guid userId, CancellationToken ct = default)
    {
        var entity = await context.ChatMembers
            .AsNoTracking()
            .Include(m => m.Role)
            .FirstOrDefaultAsync(m => m.ChatId == chatId && m.UserId == userId, ct);

        if (entity?.Role is null)
            return null;

        return Role.Restore(entity.Role.Id, entity.Role.ChatId, entity.Role.Name, entity.Role.Permissions);
    }

    public async Task AddMessageAsync(Message message, CancellationToken ct = default)
    {
        var entity = new MessageEntity
        {
            Id = message.Id,
            ChatId = message.ChatId,
            SenderId = message.SenderId,
            SenderName = message.SenderName,
            Payload = SerializePayload(message.Payload),
            SentAt = message.SentAt,
            EditedAt = message.EditedAt,
            DeletedAt = message.DeletedAt
        };

        await context.Messages.AddAsync(entity, ct);
    }

    public async Task<Message?> GetMessageAsync(Guid messageId, CancellationToken ct = default)
    {
        var entity = await context.Messages
            .Include(m => m.Sender)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == messageId, ct);

        return entity is null ? null : MapMessage(entity);
    }

    public async Task UpdateMessageAsync(Message message, CancellationToken ct = default)
    {
        await context.Messages
            .Where(m => m.Id == message.Id)
            .ExecuteUpdateAsync(s => s
                .SetProperty(m => m.Payload, SerializePayload(message.Payload))
                .SetProperty(m => m.EditedAt, message.EditedAt)
                .SetProperty(m => m.DeletedAt, message.DeletedAt), ct);
    }

    public async Task<IReadOnlyList<Message>> GetLastMessagesAsync(
        Guid chatId,
        int count,
        CancellationToken ct = default)
    {
        var entities = await context.Messages
            .AsNoTracking()
            .Where(m => m.ChatId == chatId)
            .OrderByDescending(m => m.SentAt)
            .Take(count)
            .OrderBy(m => m.SentAt)
            .ToListAsync(ct);

        return entities.Select(e => MapMessage(e)).ToList();
    }

    public async Task<IReadOnlyDictionary<Guid, Message?>> GetLastMessagePerChatAsync(
        IEnumerable<Guid> chatIds, CancellationToken ct = default)
    {
        var ids = chatIds.ToList();
        var entities = await context.Messages
            .AsNoTracking()
            .Where(m => ids.Contains(m.ChatId))
            .GroupBy(m => m.ChatId)
            .Select(g => g.OrderByDescending(m => m.SentAt).First())
            .ToListAsync(ct);

        var senderIds = entities.Select(e => e.SenderId).Distinct().ToList();
        var avatarLookup = await context.Users
            .AsNoTracking()
            .Where(u => senderIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.AvatarUrl, ct);

        var result = entities.ToDictionary(
            e => e.ChatId,
            e => (Message?)MapMessage(e, avatarLookup.GetValueOrDefault(e.SenderId)));

        foreach (var id in ids.Where(id => !result.ContainsKey(id)))
            result[id] = null;

        return result;
    }

    public async Task<IReadOnlyDictionary<Guid, int>> GetUnreadCountsAsync(
        Guid userId, IEnumerable<Guid> chatIds, CancellationToken ct = default)
    {
        var ids = chatIds.ToList();
        var lastReadMap = await context.ChatMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && ids.Contains(m.ChatId))
            .ToDictionaryAsync(m => m.ChatId, m => m.LastReadAt, ct);

        var result = new Dictionary<Guid, int>();
        foreach (var chatId in ids)
        {
            var lastRead = lastReadMap.GetValueOrDefault(chatId);
            var count = lastRead.HasValue
                ? await context.Messages.AsNoTracking()
                    .CountAsync(m => m.ChatId == chatId && m.SenderId != userId && m.DeletedAt == null && m.SentAt > lastRead.Value, ct)
                : await context.Messages.AsNoTracking()
                    .CountAsync(m => m.ChatId == chatId && m.SenderId != userId && m.DeletedAt == null, ct);
            result[chatId] = count;
        }

        return result;
    }

    public async Task MarkChatReadAsync(Guid chatId, Guid userId, CancellationToken ct = default) =>
        await context.ChatMembers
            .Where(m => m.ChatId == chatId && m.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.LastReadAt, DateTime.UtcNow), ct);

    public Task<DateTime?> GetLastReadAtAsync(Guid chatId, Guid userId, CancellationToken ct = default) =>
        context.ChatMembers
            .AsNoTracking()
            .Where(m => m.ChatId == chatId && m.UserId == userId)
            .Select(m => m.LastReadAt)
            .FirstOrDefaultAsync(ct);

    public async Task<(IReadOnlyList<Message> Messages, bool HasMore)> GetMessagesPageAsync(
        Guid chatId, int count, Guid? beforeMessageId, CancellationToken ct = default)
    {
        IQueryable<MessageEntity> query = context.Messages
            .AsNoTracking()
            .Where(m => m.ChatId == chatId);

        if (beforeMessageId.HasValue)
        {
            var cursor = await context.Messages
                .AsNoTracking()
                .Where(m => m.Id == beforeMessageId.Value)
                .Select(m => new { m.SentAt, m.Id })
                .FirstOrDefaultAsync(ct);

            if (cursor is not null)
                query = query.Where(m =>
                    m.SentAt < cursor.SentAt ||
                    (m.SentAt == cursor.SentAt && m.Id.CompareTo(cursor.Id) < 0));
        }

        var entities = await query
            .Include(m => m.Sender)
            .OrderByDescending(m => m.SentAt)
            .Take(count + 1)
            .ToListAsync(ct);

        var hasMore = entities.Count > count;
        if (hasMore) entities.RemoveAt(entities.Count - 1);

        entities.Reverse();

        var messages = entities.Select(e => MapMessage(e)).ToList();

        return (messages, hasMore);
    }

    public async Task<(IReadOnlyList<Message> Messages, bool HasMore)> GetMessagesAroundAsync(
        Guid chatId, Guid aroundMessageId, int count, CancellationToken ct = default)
    {
        var anchor = await context.Messages
            .AsNoTracking()
            .Where(m => m.Id == aroundMessageId && m.ChatId == chatId)
            .Select(m => new { m.SentAt, m.Id })
            .FirstOrDefaultAsync(ct);

        if (anchor is null)
            return (Array.Empty<Message>(), false);

        var half = Math.Max(1, count / 2);

        var olderTask = context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.ChatId == chatId && (
                m.SentAt < anchor.SentAt ||
                (m.SentAt == anchor.SentAt && m.Id.CompareTo(anchor.Id) < 0)))
            .OrderByDescending(m => m.SentAt)
            .Take(half + 1)
            .ToListAsync(ct);

        var newerTask = context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.ChatId == chatId && (
                m.SentAt > anchor.SentAt ||
                (m.SentAt == anchor.SentAt && m.Id.CompareTo(anchor.Id) >= 0)))
            .OrderBy(m => m.SentAt)
            .Take(half)
            .ToListAsync(ct);

        await Task.WhenAll(olderTask, newerTask);

        var older = olderTask.Result;
        var hasMore = older.Count > half;
        if (hasMore) older.RemoveAt(older.Count - 1);
        older.Reverse();

        var combined = older.Concat(newerTask.Result).ToList();

        return (combined.Select(e => MapMessage(e)).ToList(), hasMore);
    }

    public Task<Guid?> GetFirstUnreadMessageIdAsync(
        Guid chatId, Guid userId, DateTime? lastReadAt, CancellationToken ct = default)
    {
        var query = context.Messages
            .AsNoTracking()
            .Where(m => m.ChatId == chatId && m.SenderId != userId && m.DeletedAt == null);

        if (lastReadAt.HasValue)
            query = query.Where(m => m.SentAt > lastReadAt.Value);

        return query
            .OrderBy(m => m.SentAt)
            .Select(m => (Guid?)m.Id)
            .FirstOrDefaultAsync(ct);
    }

    public async Task AddMemberAsync(Guid chatId, Guid userId, Guid? roleId, CancellationToken ct = default)
    {
        var entity = new ChatMemberEntity
        {
            ChatId = chatId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow,
            RoleId = roleId
        };
        await context.ChatMembers.AddAsync(entity, ct);
    }

    public async Task RemoveMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default)
    {
        var entity = await context.ChatMembers
            .FirstOrDefaultAsync(m => m.ChatId == chatId && m.UserId == userId, ct);
        if (entity is not null)
            context.ChatMembers.Remove(entity);
    }

    public async Task DeleteAsync(Guid chatId, CancellationToken ct = default)
    {
        await using var tx = await context.Database.BeginTransactionAsync(ct);
        await context.ChatMembers.Where(m => m.ChatId == chatId).ExecuteDeleteAsync(ct);
        await context.Roles.Where(r => r.ChatId == chatId).ExecuteDeleteAsync(ct);
        await context.Messages.Where(m => m.ChatId == chatId).ExecuteDeleteAsync(ct);
        await context.Chats.Where(c => c.Id == chatId).ExecuteDeleteAsync(ct);
        await tx.CommitAsync(ct);
    }

    public async Task MuteChatAsync(Guid chatId, Guid userId, DateTime? mutedUntil, CancellationToken ct = default) =>
        await context.ChatMembers
            .Where(m => m.ChatId == chatId && m.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.MutedUntil, mutedUntil), ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            throw new ConflictException("A record with the same unique key already exists.");
        }
    }

    private static Message MapMessage(MessageEntity e, string? senderAvatarUrl = null) =>
        Message.Restore(
            e.Id, e.ChatId, e.SenderId, e.SenderName,
            DeserializePayload(e.Payload),
            e.SentAt, e.EditedAt, e.DeletedAt, senderAvatarUrl ?? e.Sender?.AvatarUrl);

    private static ChatEntity MapToEntity(Domain.Models.Chat chat) => new()
    {
        Id = chat.Id,
        Type = chat.Type,
        Name = chat.Name,
        OwnerId = chat.OwnerId,
        DefaultMemberRoleId = chat.DefaultMemberRoleId,
        CreatedAt = chat.CreatedAt,
        PrivateKey = chat.Type == ChatType.Private
            ? BuildPrivateKey(chat.Members.Select(m => m.UserId))
            : null,
        Roles = chat.Roles.Select(r => new RoleEntity
        {
            Id = r.Id,
            ChatId = r.ChatId,
            Name = r.Name,
            Permissions = r.Permissions
        }).ToList(),
        Members = chat.Members.Select(m => new ChatMemberEntity
        {
            ChatId = m.ChatId,
            UserId = m.UserId,
            JoinedAt = m.JoinedAt,
            RoleId = m.RoleId
        }).ToList()
    };

    private static string BuildPrivateKey(IEnumerable<Guid> memberIds)
    {
        var sorted = memberIds.OrderBy(id => id).ToArray();
        return $"{sorted[0]}_{sorted[1]}";
    }

    private Domain.Models.Chat MapToDomain(ChatEntity entity) =>
        Domain.Models.Chat.Restore(
            entity.Id,
            entity.Type,
            entity.Name,
            entity.OwnerId,
            entity.DefaultMemberRoleId,
            entity.CreatedAt,
            entity.Members
                .Select(m =>
                {
                    if (m.User is null && entity.Type != ChatType.Private)
                        logger.LogWarning(
                            "User navigation property is null for member {UserId} in chat {ChatId}.",
                            m.UserId, m.ChatId);
                    return ChatMember.Restore(
                        m.ChatId, m.UserId, m.JoinedAt, m.RoleId,
                        m.Role?.Name, m.User?.UserName, m.User?.AvatarUrl, m.MutedUntil);
                })
                .ToList(),
            [],
            entity.Roles
                .Select(r => Role.Restore(r.Id, r.ChatId, r.Name, r.Permissions))
                .ToList());
}
