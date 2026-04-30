namespace Chat.Application.Interfaces;

public interface IOfflineDebouncer
{
    void ScheduleOffline(Guid userId);
    void CancelPending(Guid userId);
}