namespace Chat.API.Contracts.Chats;

public record MessagesPageResponse(
    IReadOnlyList<MessageResponse> Messages,
    bool HasMore,
    Guid? FirstUnreadMessageId
);