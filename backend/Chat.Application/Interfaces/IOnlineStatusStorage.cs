namespace Chat.Application.Interfaces;

public interface IOnlineStatusStorage
{
    Task<bool> AddConnectionAsync(Guid userId, string connectionId, CancellationToken ct = default);
    Task<bool> RemoveConnectionAsync(Guid userId, string connectionId, CancellationToken ct = default);
    Task<bool> IsOnlineAsync(Guid userId, CancellationToken ct = default);
    Task<int> GetOnlineCountAsync(IEnumerable<Guid> memberIds, CancellationToken ct = default);
    Task RefreshAllTtlsAsync(CancellationToken ct = default);
}