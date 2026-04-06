using Chat.Domain.Enums;

namespace Chat.Infrastructure.Persistence.Entities;

public class ChatEntity
{
    public Guid Id { get; set; }
    public ChatType Type { get; set; }
    public string? Name { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<ChatMemberEntity> Members { get; set; } = [];
    public ICollection<MessageEntity> Messages { get; set; } = [];
}