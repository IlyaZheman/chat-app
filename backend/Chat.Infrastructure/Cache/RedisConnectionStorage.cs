using System.Text.Json;
using Chat.Application.Interfaces;
using Chat.Domain.ValueObjects;
using Microsoft.Extensions.Caching.Distributed;

namespace Chat.Infrastructure.Cache;

public class RedisConnectionStorage(IDistributedCache cache) : IConnectionStorage
{
    public async Task SaveAsync(string connectionId, UserConnection connection, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(connection);
        await cache.SetStringAsync(connectionId, json, ct);
    }

    public async Task<UserConnection?> GetAsync(string connectionId, CancellationToken ct = default)
    {
        var json = await cache.GetStringAsync(connectionId, ct);
        return json is null ? null : JsonSerializer.Deserialize<UserConnection>(json);
    }

    public async Task RemoveAsync(string connectionId, CancellationToken ct = default)
    {
        await cache.RemoveAsync(connectionId, ct);
    }
}