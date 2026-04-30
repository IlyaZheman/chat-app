namespace Chat.API.Contracts.Chats;

public record PrivateChatResponse(
    Guid Id,
    string Type,
    DateTime CreatedAt,
    string? OtherUserName,
    Guid? OtherUserId,
    string? OtherUserAvatarUrl,
    bool IsOnline,
    MessageResponse? LastMessage,
    int UnreadCount,
    DateTime? MutedUntil
);
