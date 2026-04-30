namespace Chat.API.Contracts.Chats;

public record GroupChatResponse(
    Guid Id,
    string Type,
    string? Name,
    DateTime CreatedAt,
    string? MyRole,
    int MemberCount,
    int OnlineCount,
    MessageResponse? LastMessage,
    int UnreadCount,
    DateTime? MutedUntil
);
