using System.Collections.Concurrent;
using Chat.Application.Chats;
using Chat.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Chat.Infrastructure.Cache;

public class OfflineDebouncer(
    IServiceScopeFactory scopeFactory,
    ILogger<OfflineDebouncer> logger) : IOfflineDebouncer
{
    private static readonly TimeSpan GracePeriod = TimeSpan.FromSeconds(8);
    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> _pending = new();

    public void CancelPending(Guid userId)
    {
        if (_pending.TryRemove(userId, out var cts))
        {
            cts.Cancel();
            cts.Dispose();
        }
    }

    public void ScheduleOffline(Guid userId)
    {
        CancelPending(userId);
        var cts = new CancellationTokenSource();
        _pending[userId] = cts;
        _ = RunAfterDelayAsync(userId, cts.Token);
    }

    private async Task RunAfterDelayAsync(Guid userId, CancellationToken ct)
    {
        try
        {
            await Task.Delay(GracePeriod, ct);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        _pending.TryRemove(userId, out var cts);
        cts?.Dispose();

        try
        {
            using var scope = scopeFactory.CreateScope();
            var handler = scope.ServiceProvider.GetRequiredService<UserPresenceHandler>();
            await handler.ProcessPendingOfflineAsync(userId, CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process pending offline notification for user {UserId}", userId);
        }
    }
}