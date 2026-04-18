namespace Chat.Domain.ValueObjects;

public record UserConnection(
    Guid UserId,
    string UserName,
    Guid ChatId
);