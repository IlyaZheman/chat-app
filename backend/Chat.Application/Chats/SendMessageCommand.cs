namespace Chat.Application.Chats;

public record SendMessageCommand(
    string? Text,
    string? Url,
    string? FileName,
    string? MediaType,
    string? Caption = null,
    string CaptionPosition = "below"
);
