namespace Chat.Infrastructure.Persistence.Entities;

public class ChatMemberEntity
{
    public Guid ChatId { get; set; }
    public Guid UserId { get; set; }
    public DateTime JoinedAt { get; set; }
    public Guid? RoleId { get; set; }
    public DateTime? LastReadAt { get; set; }
    public DateTime? MutedUntil { get; set; }

    public ChatEntity Chat { get; set; } = null!;
    public UserEntity User { get; set; } = null!;
    public RoleEntity? Role { get; set; }
}
