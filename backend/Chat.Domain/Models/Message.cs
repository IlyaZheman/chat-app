namespace Chat.Domain.Models;

public class Message
{
    public Guid Id { get; private set; }
    public Guid ChatId { get; private set; }
    public Guid SenderId { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public DateTime SentAt { get; private set; }

    private Message()
    {
    }

    public static Message Create(Guid chatId, Guid senderId, string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new ArgumentException("Message text cannot be empty.");

        return new Message
        {
            Id = Guid.NewGuid(),
            ChatId = chatId,
            SenderId = senderId,
            Text = text,
            SentAt = DateTime.UtcNow
        };
    }

    public static Message Restore(Guid id, Guid chatId, Guid senderId, string text, DateTime sentAt) =>
        new() { Id = id, ChatId = chatId, SenderId = senderId, Text = text, SentAt = sentAt };
}