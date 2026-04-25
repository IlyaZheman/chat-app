namespace Chat.Infrastructure.Persistence.Entities;

public class MessageEntity
{
    public Guid Id { get; set; }
    public Guid ChatId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }

    public ChatEntity Chat { get; set; } = null!;
    public UserEntity Sender { get; set; } = null!;
}