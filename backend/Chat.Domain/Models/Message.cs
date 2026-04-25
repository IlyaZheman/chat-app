namespace Chat.Domain.Models;

public class Message
{
    public Guid Id { get; private set; }
    public Guid ChatId { get; private set; }
    public Guid SenderId { get; private set; }
    public string SenderName { get; private set; } = string.Empty;
    public MessagePayload Payload { get; private set; } = null!;
    public DateTime SentAt { get; private set; }

    private Message() { }

    public static Message Create(Guid chatId, Guid senderId, string senderName, MessagePayload payload) =>
        new()
        {
            Id = Guid.NewGuid(),
            ChatId = chatId,
            SenderId = senderId,
            SenderName = senderName,
            Payload = payload,
            SentAt = DateTime.UtcNow
        };

    public static Message Restore(
        Guid id,
        Guid chatId,
        Guid senderId,
        string senderName,
        MessagePayload payload,
        DateTime sentAt) =>
        new() { Id = id, ChatId = chatId, SenderId = senderId, SenderName = senderName, Payload = payload, SentAt = sentAt };
}