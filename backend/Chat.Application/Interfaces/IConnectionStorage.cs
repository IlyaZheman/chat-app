using Chat.Application.Models;

namespace Chat.Application.Interfaces;

public interface IConnectionStorage
{
    Task SaveAsync(string connectionId, UserConnection connection, CancellationToken ct = default);
    Task<UserConnection?> GetAsync(string connectionId, CancellationToken ct = default);
    Task RemoveAsync(string connectionId, CancellationToken ct = default);
}