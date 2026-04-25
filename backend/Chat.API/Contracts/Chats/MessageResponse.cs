using Chat.Infrastructure.Notifications;

namespace Chat.API.Contracts.Chats;

public record MessageResponse(
    Guid Id,
    string SenderName,
    DateTime SentAt,
    MessagePayloadDto Payload
);