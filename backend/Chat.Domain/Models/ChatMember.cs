namespace Chat.Domain.Models;

public class ChatMember
{
    public Guid ChatId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime JoinedAt { get; private set; }

    private ChatMember()
    {
    }

    public static ChatMember Create(Guid chatId, Guid userId)
    {
        return new ChatMember
        {
            ChatId = chatId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow
        };
    }

    public static ChatMember Restore(Guid chatId, Guid userId, DateTime joinedAt) =>
        new() { ChatId = chatId, UserId = userId, JoinedAt = joinedAt };
}