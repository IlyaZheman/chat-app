using Chat.Domain.ValueObjects;

namespace Chat.Application.Interfaces;

// Абстракция над Redis — Application не знает про конкретное хранилище
public interface IConnectionStorage
{
    Task SaveAsync(string connectionId, UserConnection connection, CancellationToken ct = default);
    Task<UserConnection?> GetAsync(string connectionId, CancellationToken ct = default);
    Task RemoveAsync(string connectionId, CancellationToken ct = default);
}