namespace Chat.API.Contracts.Chats;

public record ChatResponse(
    Guid Id,
    string Type,
    string? Name,
    DateTime CreatedAt,
    string? MyRole,
    string? OtherUserName,
    Guid? OtherUserId,
    int MemberCount,
    bool IsOnline,
    int OnlineCount
);