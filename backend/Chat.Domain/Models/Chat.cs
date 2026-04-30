using Chat.Domain.Enums;
using Chat.Domain.Exceptions;

namespace Chat.Domain.Models;

public class Chat
{
    public Guid Id { get; private set; }
    public ChatType Type { get; private set; }
    public string? Name { get; private set; }
    public Guid? OwnerId { get; private set; }
    public Guid? DefaultMemberRoleId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public IReadOnlyCollection<ChatMember> Members => _members.AsReadOnly();
    public IReadOnlyCollection<Message> Messages => _messages.AsReadOnly();
    public IReadOnlyCollection<Role> Roles => _roles.AsReadOnly();

    private readonly List<ChatMember> _members = [];
    private readonly List<Message> _messages = [];
    private readonly List<Role> _roles = [];

    private Chat() { }

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
            OwnerId = creatorId,
            CreatedAt = DateTime.UtcNow
        };

        var ownerRole = Role.Create(chat.Id, "Owner", ChatPermissions.FullAccess);
        var memberRole = Role.Create(chat.Id, "Member", ChatPermissions.DefaultMember);
        chat._roles.Add(ownerRole);
        chat._roles.Add(memberRole);
        chat.DefaultMemberRoleId = memberRole.Id;

        chat._members.Add(ChatMember.Create(chat.Id, creatorId, ownerRole.Id));

        return chat;
    }

    public static Chat CreateChannel(string name, Guid creatorId)
    {
        var chat = new Chat
        {
            Id = Guid.NewGuid(),
            Type = ChatType.Channel,
            Name = name,
            OwnerId = creatorId,
            CreatedAt = DateTime.UtcNow
        };

        var adminRole = Role.Create(chat.Id, "Admin", ChatPermissions.FullAccess);
        var subscriberRole = Role.Create(chat.Id, "Subscriber", ChatPermissions.Subscriber);
        chat._roles.Add(adminRole);
        chat._roles.Add(subscriberRole);
        chat.DefaultMemberRoleId = subscriberRole.Id;

        chat._members.Add(ChatMember.Create(chat.Id, creatorId, adminRole.Id));

        return chat;
    }

    public static Chat Restore(
        Guid id,
        ChatType type,
        string? name,
        Guid? ownerId,
        Guid? defaultMemberRoleId,
        DateTime createdAt,
        IEnumerable<ChatMember> members,
        IEnumerable<Message> messages,
        IEnumerable<Role> roles)
    {
        var chat = new Chat
        {
            Id = id,
            Type = type,
            Name = name,
            OwnerId = ownerId,
            DefaultMemberRoleId = defaultMemberRoleId,
            CreatedAt = createdAt
        };
        chat._members.AddRange(members);
        chat._messages.AddRange(messages);
        chat._roles.AddRange(roles);
        return chat;
    }

    public void AddMember(Guid userId)
    {
        if (Type == ChatType.Private)
            throw new InvalidOperationException("Cannot add members to a private chat.");

        if (_members.Any(m => m.UserId == userId))
            throw new InvalidOperationException("User is already a member of this chat.");

        _members.Add(ChatMember.Create(Id, userId, DefaultMemberRoleId));
    }

    public void RemoveMember(Guid userId)
    {
        if (Type == ChatType.Private)
            throw new InvalidOperationException("Cannot leave a private chat.");

        var member = _members.FirstOrDefault(m => m.UserId == userId)
            ?? throw new InvalidOperationException("User is not a member of this chat.");

        _members.Remove(member);
    }

    public void DeleteChat(Guid requesterId)
    {
        if (Type == ChatType.Private)
            throw new InvalidOperationException("Cannot delete a private chat this way.");

        if (OwnerId != requesterId)
            throw new ForbiddenException("Only the owner can delete this chat.");
    }

    public void RemoveMemberByOwner(Guid requesterId, Guid targetUserId)
    {
        if (Type == ChatType.Private)
            throw new InvalidOperationException("Cannot remove members from a private chat.");

        EnsureCanManageMembers(requesterId);

        if (requesterId == targetUserId)
            throw new InvalidOperationException("You cannot remove yourself. Leave or delete the chat instead.");

        RemoveMember(targetUserId);
    }

    private void EnsureCanManageMembers(Guid userId)
    {
        var member = _members.FirstOrDefault(m => m.UserId == userId)
            ?? throw new ForbiddenException("User is not a member of this chat.");

        var role = _roles.FirstOrDefault(r => r.Id == member.RoleId);
        if (role is null || !role.Permissions.CanManageMembers)
            throw new ForbiddenException("Insufficient permissions to manage members.");
    }
}
