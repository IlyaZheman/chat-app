using Chat.Domain.Exceptions;

namespace Chat.Domain.Models;

public class Message
{
    public Guid Id { get; private set; }
    public Guid ChatId { get; private set; }
    public Guid SenderId { get; private set; }
    public string SenderName { get; private set; } = string.Empty;
    public string? SenderAvatarUrl { get; private set; }
    public MessagePayload Payload { get; private set; } = null!;
    public DateTime SentAt { get; private set; }
    public DateTime? EditedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    public bool IsDeleted => DeletedAt.HasValue;

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
        DateTime sentAt,
        DateTime? editedAt = null,
        DateTime? deletedAt = null,
        string? senderAvatarUrl = null) =>
        new()
        {
            Id = id,
            ChatId = chatId,
            SenderId = senderId,
            SenderName = senderName,
            SenderAvatarUrl = senderAvatarUrl,
            Payload = payload,
            SentAt = sentAt,
            EditedAt = editedAt,
            DeletedAt = deletedAt
        };

    public void EditText(Guid editorId, string newText)
    {
        if (IsDeleted)
            throw new ConflictException("Cannot edit a deleted message.");
        if (editorId != SenderId)
            throw new ForbiddenException("Only the author can edit this message.");
        if (Payload is not TextPayload)
            throw new ConflictException("Only text messages can be edited.");
        if (string.IsNullOrWhiteSpace(newText))
            throw new ArgumentException("Text cannot be empty.", nameof(newText));

        Payload = new TextPayload(newText);
        EditedAt = DateTime.UtcNow;
    }

    public void MarkDeleted()
    {
        if (IsDeleted) return;
        DeletedAt = DateTime.UtcNow;
    }
}
