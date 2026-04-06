namespace Chat.API.Contracts.Chats;

public record GetOrCreatePrivateChatRequest(
    Guid TargetUserId
);