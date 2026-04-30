namespace Chat.Application.Models;

public record UserConnection(
    Guid UserId,
    string UserName,
    Guid ChatId,
    string? AvatarUrl = null
);
