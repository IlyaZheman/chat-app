using Chat.Domain.Enums;

namespace Chat.Domain.Models;

public class ChatMember
{
    public Guid ChatId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime JoinedAt { get; private set; }
    public ChatMemberRole Role { get; private set; }
    public string? UserName { get; private set; }

    private ChatMember()
    {
    }

    public static ChatMember Create(Guid chatId, Guid userId, ChatMemberRole role = ChatMemberRole.Member)
    {
        return new ChatMember
        {
            ChatId = chatId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow,
            Role = role
        };
    }

    public static ChatMember Restore(
        Guid chatId,
        Guid userId,
        DateTime joinedAt,
        ChatMemberRole role,
        string? userName = null) =>
        new() { ChatId = chatId, UserId = userId, JoinedAt = joinedAt, Role = role, UserName = userName };
}