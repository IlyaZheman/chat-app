using Chat.Domain.Models;

namespace Chat.Infrastructure.Persistence.Entities;

public class RoleEntity
{
    public Guid Id { get; set; }
    public Guid ChatId { get; set; }
    public string Name { get; set; } = string.Empty;
    public ChatPermissions Permissions { get; set; } = ChatPermissions.DefaultMember;

    public ChatEntity Chat { get; set; } = null!;
    public ICollection<ChatMemberEntity> Members { get; set; } = [];
}
