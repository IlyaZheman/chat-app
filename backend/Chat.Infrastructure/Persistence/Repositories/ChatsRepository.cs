using Chat.Domain.Enums;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;
using Chat.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Chat.Infrastructure.Persistence.Repositories;

public class ChatsRepository(AppDbContext context) : IChatsRepository
{
    public async Task AddAsync(Domain.Models.Chat chat, CancellationToken ct = default)
    {
        var entity = MapToEntity(chat);
        await context.Chats.AddAsync(entity, ct);
    }

    public async Task<Domain.Models.Chat?> GetByIdAsync(Guid chatId, CancellationToken ct = default)
    {
        var entity = await context.Chats
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
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

    public async Task<IReadOnlyList<Domain.Models.Chat>> GetAllGroupChatsAsync(CancellationToken ct = default)
    {
        var entities = await context.Chats
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .AsNoTracking()
            .Where(c => c.Type == ChatType.Group)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

        return entities.Select(MapToDomain).ToList();
    }

    public async Task<IReadOnlyList<Domain.Models.Chat>> GetUserChatsAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var entities = await context.Chats
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .AsNoTracking()
            .Where(c => c.Members.Any(m => m.UserId == userId))
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

        return entities.Select(MapToDomain).ToList();
    }

    public Task<bool> ExistsAsync(Guid chatId, CancellationToken ct = default) =>
        context.Chats.AnyAsync(c => c.Id == chatId, ct);

    public Task<bool> IsMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default) =>
        context.ChatMembers.AnyAsync(m => m.ChatId == chatId && m.UserId == userId, ct);

    public async Task<ChatMemberRole?> GetMemberRoleAsync(Guid chatId, Guid userId, CancellationToken ct = default)
    {
        var entity = await context.ChatMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.ChatId == chatId && m.UserId == userId, ct);

        return entity?.Role;
    }

    public async Task AddMessageAsync(Message message, CancellationToken ct = default)
    {
        var entity = new MessageEntity
        {
            Id = message.Id,
            ChatId = message.ChatId,
            SenderId = message.SenderId,
            SenderName = message.SenderName,
            Text = message.Text,
            SentAt = message.SentAt
        };

        await context.Messages.AddAsync(entity, ct);
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

        return entities
            .Select(e => Message.Restore(e.Id, e.ChatId, e.SenderId, e.SenderName, e.Text, e.SentAt))
            .ToList();
    }

    public async Task AddMemberAsync(Guid chatId, Guid userId, CancellationToken ct = default)
    {
        var entity = new ChatMemberEntity
        {
            ChatId = chatId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow,
            Role = ChatMemberRole.Member
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
        await context.Messages.Where(m => m.ChatId == chatId).ExecuteDeleteAsync(ct);
        await context.Chats.Where(c => c.Id == chatId).ExecuteDeleteAsync(ct);
        await tx.CommitAsync(ct);
    }

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        context.SaveChangesAsync(ct);

    private static ChatEntity MapToEntity(Domain.Models.Chat chat) => new()
    {
        Id = chat.Id,
        Type = chat.Type,
        Name = chat.Name,
        CreatedAt = chat.CreatedAt,
        Members = chat.Members.Select(m => new ChatMemberEntity
        {
            ChatId = m.ChatId,
            UserId = m.UserId,
            JoinedAt = m.JoinedAt,
            Role = m.Role
        }).ToList()
    };

    private static Domain.Models.Chat MapToDomain(ChatEntity entity) =>
        Domain.Models.Chat.Restore(
            entity.Id,
            entity.Type,
            entity.Name,
            entity.CreatedAt,
            entity.Members.Select(m => ChatMember.Restore(m.ChatId, m.UserId, m.JoinedAt, m.Role, m.User?.UserName)).ToList(),
            []);
}
