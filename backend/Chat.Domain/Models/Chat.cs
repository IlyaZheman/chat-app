using Chat.Domain.Enums;

namespace Chat.Domain.Models;

public class Chat
{
    public Guid Id { get; private set; }
    public ChatType Type { get; private set; }
    public string? Name { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public IReadOnlyCollection<ChatMember> Members => _members.AsReadOnly();
    public IReadOnlyCollection<Message> Messages => _messages.AsReadOnly();

    private readonly List<ChatMember> _members = [];
    private readonly List<Message> _messages = [];

    private Chat()
    {
    }

    public static Chat CreatePrivate(Guid firstUserId, Guid secondUserId)
    {
        var chat = new Chat
        {
            Id = Guid.NewGuid(),
            Type = ChatType.Private,
            CreatedAt = DateTime.UtcNow
        };

        chat._members.Add(ChatMember.Create(chat.Id, firstUserId));
        chat._members.Add(ChatMember.Create(chat.Id, secondUserId));

        return chat;
    }

    public static Chat CreateGroup(string name, Guid creatorId)
    {
        var chat = new Chat
        {
            Id = Guid.NewGuid(),
            Type = ChatType.Group,
            Name = name,
            CreatedAt = DateTime.UtcNow
        };

        chat._members.Add(ChatMember.Create(chat.Id, creatorId));

        return chat;
    }

    public static Chat Restore(
        Guid id,
        ChatType type,
        string? name,
        DateTime createdAt,
        IEnumerable<ChatMember> members,
        IEnumerable<Message> messages)
    {
        var chat = new Chat
        {
            Id = id,
            Type = type,
            Name = name,
            CreatedAt = createdAt
        };
        chat._members.AddRange(members);
        chat._messages.AddRange(messages);
        return chat;
    }

    public void AddMember(Guid userId)
    {
        if (Type == ChatType.Private)
            throw new InvalidOperationException("Cannot add members to a private chat.");

        if (_members.Any(m => m.UserId == userId))
            throw new InvalidOperationException("User is already a member of this chat.");

        _members.Add(ChatMember.Create(Id, userId));
    }

    public void RemoveMember(Guid userId)
    {
        if (Type == ChatType.Private)
            throw new InvalidOperationException("Cannot leave a private chat.");

        var member = _members.FirstOrDefault(m => m.UserId == userId)
            ?? throw new InvalidOperationException("User is not a member of this chat.");

        _members.Remove(member);
    }
}