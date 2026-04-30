using Chat.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Chat.Infrastructure.Cache;

public class OnlinePresenceHeartbeatService(
    IServiceScopeFactory scopeFactory,
    ILogger<OnlinePresenceHeartbeatService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(2);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(Interval, stoppingToken);
                using var scope = scopeFactory.CreateScope();
                var storage = scope.ServiceProvider.GetRequiredService<IOnlineStatusStorage>();
                await storage.RefreshAllTtlsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to refresh presence TTLs");
            }
        }
    }
}