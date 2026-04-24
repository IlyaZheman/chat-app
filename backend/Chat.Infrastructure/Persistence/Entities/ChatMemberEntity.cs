using Chat.Domain.Enums;

namespace Chat.Infrastructure.Persistence.Entities;

public class ChatMemberEntity
{
    public Guid ChatId { get; set; }
    public Guid UserId { get; set; }
    public DateTime JoinedAt { get; set; }
    public ChatMemberRole Role { get; set; }

    public ChatEntity Chat { get; set; } = null!;
    public UserEntity User { get; set; } = null!;
}