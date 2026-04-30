namespace Chat.API.Contracts.Chats;

public record MuteChatRequest(
    DateTime? MutedUntil
);