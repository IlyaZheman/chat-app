namespace Chat.Domain.Models;

public class ChatMember
{
    public Guid ChatId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime JoinedAt { get; private set; }
    public Guid? RoleId { get; private set; }
    public string? RoleName { get; private set; }
    public string? UserName { get; private set; }
    public string? AvatarUrl { get; private set; }
    public DateTime? MutedUntil { get; private set; }

    private ChatMember() { }

    public static ChatMember Create(Guid chatId, Guid userId, Guid? roleId = null) =>
        new() { ChatId = chatId, UserId = userId, JoinedAt = DateTime.UtcNow, RoleId = roleId };

    public static ChatMember Restore(
        Guid chatId,
        Guid userId,
        DateTime joinedAt,
        Guid? roleId,
        string? roleName = null,
        string? userName = null,
        string? avatarUrl = null,
        DateTime? mutedUntil = null) =>
        new()
        {
            ChatId = chatId, UserId = userId, JoinedAt = joinedAt, RoleId = roleId,
            RoleName = roleName, UserName = userName, AvatarUrl = avatarUrl,
            MutedUntil = mutedUntil
        };
}
