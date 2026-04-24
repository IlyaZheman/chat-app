namespace Chat.API.Contracts.Chats;

public record ChatResponse(
    Guid Id,
    string Type,
    string? Name,
    DateTime CreatedAt,
    string MyRole,
    string? OtherUserName
);