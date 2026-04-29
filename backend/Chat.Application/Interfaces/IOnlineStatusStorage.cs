namespace Chat.Application.Interfaces;

public interface IOnlineStatusStorage
{
    Task<bool> SetOnlineAsync(Guid userId, CancellationToken ct = default);
    Task<bool> SetOfflineAsync(Guid userId, CancellationToken ct = default);
    Task<bool> IsOnlineAsync(Guid userId, CancellationToken ct = default);
    Task<int> GetOnlineCountAsync(IEnumerable<Guid> memberIds, CancellationToken ct = default);
}
