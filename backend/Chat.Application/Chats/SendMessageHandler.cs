using Chat.Application.Interfaces;
using Chat.Domain.Exceptions;
using Chat.Domain.Interfaces;
using Chat.Domain.Models;

namespace Chat.Application.Chats;

public class SendMessageHandler(
    IChatsRepository chatsRepository,
    IConnectionStorage connectionStorage,
    IChatNotifier notifier)
{
    public async Task HandleAsync(string connectionId, SendMessageCommand command, CancellationToken ct = default)
    {
        var connection = await connectionStorage.GetAsync(connectionId, ct)
            ?? throw new ForbiddenException("Connection not found. Join a chat first.");

        if (!await chatsRepository.IsMemberAsync(connection.ChatId, connection.UserId, ct))
            throw new ForbiddenException("User is not a member of this chat.");

        var payload = BuildPayload(command);
        var message = Message.Create(connection.ChatId, connection.UserId, connection.UserName, payload);

        await chatsRepository.AddMessageAsync(message, ct);
        await chatsRepository.SaveChangesAsync(ct);

        await notifier.NotifyMessageAsync(connection.ChatId, connection.UserName, payload, ct);
    }

    private static MessagePayload BuildPayload(SendMessageCommand cmd)
    {
        if (cmd.Url is not null)
        {
            if (cmd.MediaType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true)
            {
                var pos = Enum.TryParse<CaptionPosition>(cmd.CaptionPosition, true, out var p)
                    ? p : CaptionPosition.Below;
                return new ImagePayload(cmd.Url, cmd.FileName!, cmd.Caption, pos, cmd.FileSize ?? 0);
            }
            return new FilePayload(cmd.Url, cmd.FileName!, cmd.MediaType!, cmd.FileSize ?? 0);
        }

        if (!string.IsNullOrWhiteSpace(cmd.Text))
            return new TextPayload(cmd.Text);

        throw new ArgumentException("Message must have text or an attachment.");
    }
}