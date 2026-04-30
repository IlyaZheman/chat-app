using Chat.Infrastructure.Notifications;

namespace Chat.API.Contracts.Chats;

public record MessageResponse(
    Guid Id,
    string SenderName,
    string? SenderAvatarUrl,
    DateTime SentAt,
    MessagePayloadDto Payload,
    DateTime? EditedAt = null,
    DateTime? DeletedAt = null
);
