namespace Chat.Domain.Models;

public record ChatPermissions(
    bool CanSendMessages,
    bool CanDeleteMessages,
    bool CanManageMembers,
    bool CanManageRoles)
{
    public static ChatPermissions FullAccess => new(true, true, true, true);
    public static ChatPermissions DefaultMember => new(true, false, false, false);
    public static ChatPermissions Subscriber => new(false, false, false, false);
}
