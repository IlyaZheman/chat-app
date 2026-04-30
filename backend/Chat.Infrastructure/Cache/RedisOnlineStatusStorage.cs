using Chat.Application.Interfaces;
using StackExchange.Redis;

namespace Chat.Infrastructure.Cache;

public class RedisOnlineStatusStorage(IConnectionMultiplexer redis) : IOnlineStatusStorage
{
    private const string KeyPrefix = "user_conn:";
    private static readonly TimeSpan ConnectionKeyTtl = TimeSpan.FromMinutes(5);

    private static string Key(Guid userId) => $"{KeyPrefix}{userId}";

    public async Task<bool> AddConnectionAsync(Guid userId, string connectionId, CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        var key = Key(userId);
        var added = await db.SetAddAsync(key, connectionId);
        await db.KeyExpireAsync(key, ConnectionKeyTtl);
        if (!added) return false;
        var count = await db.SetLengthAsync(key);
        return count == 1;
    }

    public async Task<bool> RemoveConnectionAsync(Guid userId, string connectionId, CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        var key = Key(userId);
        var removed = await db.SetRemoveAsync(key, connectionId);
        if (!removed) return false;
        var count = await db.SetLengthAsync(key);
        if (count == 0)
        {
            await db.KeyDeleteAsync(key);
            return true;
        }

        return false;
    }

    public async Task<bool> IsOnlineAsync(Guid userId, CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        return await db.SetLengthAsync(Key(userId)) > 0;
    }

    public async Task<int> GetOnlineCountAsync(IEnumerable<Guid> memberIds, CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        var tasks = memberIds.Select(id => db.SetLengthAsync(Key(id))).ToArray();
        var counts = await Task.WhenAll(tasks);
        return counts.Count(c => c > 0);
    }

    public async Task RefreshAllTtlsAsync(CancellationToken ct = default)
    {
        var db = redis.GetDatabase();
        foreach (var endpoint in redis.GetEndPoints())
        {
            var server = redis.GetServer(endpoint);
            if (!server.IsConnected) continue;
            await foreach (var key in server.KeysAsync(pattern: $"{KeyPrefix}*").WithCancellation(ct))
            {
                await db.KeyExpireAsync(key, ConnectionKeyTtl);
            }
        }
    }
}