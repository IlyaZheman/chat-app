namespace Chat.API.Contracts.Chats;

public record MessageResponse(
    Guid Id,
    string SenderName,
    string Text,
    DateTime SentAt
);