using Chat.Application.Interfaces;
using StackExchange.Redis;

namespace Chat.Infrastructure.Cache;

public class RedisOnlineStatusStorage(IConnectionMultiplexer redis) : IOnlineStatusStorage
{
    private static string Key(Guid userId) => $"user_conn_count:{userId}";

    public async Task<bool> SetOnlineAsync(Guid userId, CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        var newCount = await db.StringIncrementAsync(Key(userId));
        return newCount == 1;
    }

    public async Task<bool> SetOfflineAsync(Guid userId, CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        var newCount = await db.StringDecrementAsync(Key(userId));
        if (newCount <= 0)
        {
            await db.KeyDeleteAsync(Key(userId));
            return true;
        }
        return false;
    }

    public async Task<bool> IsOnlineAsync(Guid userId, CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        var val = await db.StringGetAsync(Key(userId));
        return val.HasValue && (long)val > 0;
    }

    public async Task<int> GetOnlineCountAsync(IEnumerable<Guid> memberIds, CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        var tasks = memberIds.Select(id => db.StringGetAsync(Key(id))).ToArray();
        var values = await Task.WhenAll(tasks);
        return values.Count(v => v.HasValue && (long)v > 0);
    }
}
