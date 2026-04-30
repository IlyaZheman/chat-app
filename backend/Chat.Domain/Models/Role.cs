namespace Chat.Domain.Models;

public class Role
{
    public Guid Id { get; private set; }
    public Guid ChatId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public ChatPermissions Permissions { get; private set; } = default!;

    private Role() { }

    public static Role Create(Guid chatId, string name, ChatPermissions permissions) =>
        new() { Id = Guid.NewGuid(), ChatId = chatId, Name = name, Permissions = permissions };

    public static Role Restore(Guid id, Guid chatId, string name, ChatPermissions permissions) =>
        new() { Id = id, ChatId = chatId, Name = name, Permissions = permissions };
}
