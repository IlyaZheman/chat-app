using Chat.Domain.Enums;

namespace Chat.Infrastructure.Persistence.Entities;

public class ChatEntity
{
    public Guid Id { get; set; }
    public ChatType Type { get; set; }
    public string? Name { get; set; }
    public Guid? OwnerId { get; set; }
    public Guid? DefaultMemberRoleId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? PrivateKey { get; set; }

    public ICollection<ChatMemberEntity> Members { get; set; } = [];
    public ICollection<MessageEntity> Messages { get; set; } = [];
    public ICollection<RoleEntity> Roles { get; set; } = [];
}
