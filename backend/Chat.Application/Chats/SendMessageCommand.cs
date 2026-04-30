using Chat.Domain.Models;

namespace Chat.Application.Chats;

public record SendMessageCommand(
    MessagePayload Payload
);