namespace Chat.API.Contracts.Chats;

public record MessageResponse(
    Guid Id,
    Guid SenderId,
    string Text,
    DateTime SentAt
);