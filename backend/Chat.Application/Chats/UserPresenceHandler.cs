using Chat.Application.Interfaces;
using Chat.Domain.Enums;
using Chat.Domain.Interfaces;

namespace Chat.Application.Chats;

public class UserPresenceHandler(
    IOnlineStatusStorage onlineStorage,
    IChatsRepository chatsRepository,
    IChatNotifier chatNotifier)
{
    public async Task HandleConnectedAsync(Guid userId, CancellationToken ct = default)
    {
        var isFirstConnection = await onlineStorage.SetOnlineAsync(userId, ct);
        if (!isFirstConnection) return;

        await NotifyPresenceChangedAsync(userId, isOnline: true, ct);
    }

    public async Task HandleDisconnectedAsync(Guid userId, CancellationToken ct = default)
    {
        var isFullyOffline = await onlineStorage.SetOfflineAsync(userId, ct);
        if (!isFullyOffline) return;

        await NotifyPresenceChangedAsync(userId, isOnline: false, ct);
    }

    private async Task NotifyPresenceChangedAsync(Guid userId, bool isOnline, CancellationToken ct)
    {
        var chats = await chatsRepository.GetUserChatsAsync(userId, ct);

        var privateTasks = chats
            .Where(c => c.Type == ChatType.Private)
            .Select(c =>
            {
                var other = c.Members.FirstOrDefault(m => m.UserId != userId);
                return other is null
                    ? Task.CompletedTask
                    : chatNotifier.NotifyUserOnlineStatusChangedAsync(userId, isOnline, other.UserId, ct);
            });

        var groupTasks = chats
            .Where(c => c.Type == ChatType.Group)
            .Select(async c =>
            {
                var memberIds = c.Members.Select(m => m.UserId);
                var onlineCount = await onlineStorage.GetOnlineCountAsync(memberIds, ct);
                await chatNotifier.NotifyGroupOnlineCountAsync(c.Id, onlineCount, c.Members.Count, ct);
            });

        await Task.WhenAll(privateTasks.Concat<Task>(groupTasks));
    }
}
